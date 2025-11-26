import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

interface DrinkDispenserNFCScreenProps {
  navigation: any;
  route: any;
}

interface PrizeOption {
  id: string;
  type: 'freebie' | 'cash' | 'discount';
  name: string;
  emoji: string;
  value: string | number;
  probability: number;
  imageUrl?: string;
}

interface DrinkDispenserPromotion {
  id: string;
  placeId: string;
  businessName: string;
  dispenserName: string;
  dispenserType: string;
  drinkName: string;
  drinkCategory?: string;
  prizeType: string;
  prizeName: string;
  prizeDescription?: string;
  prizeEmoji: string;
  prizeValue?: string;
  prizeOptions?: PrizeOption[];
  winOdds: number;
  cooldownHours: number;
  enabled: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PRIZES = ['🍺', '🍻', '🥃', '🍷', '🍹', '🍸', '🥂', '🍾'];
const ROLLER_ITEM_HEIGHT = 80;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export default function DrinkDispenserNFCScreen({ navigation, route }: DrinkDispenserNFCScreenProps) {
  const { business } = route?.params || {};

  const [isSpinning, setIsSpinning] = useState(false);
  const [nfcReady, setNfcReady] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [promotion, setPromotion] = useState<DrinkDispenserPromotion | null>(null);
  const [loadingPromotion, setLoadingPromotion] = useState(true);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [inCooldown, setInCooldown] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const leftRoller = useRef(new Animated.Value(0)).current;
  const centerRoller = useRef(new Animated.Value(0)).current;
  const rightRoller = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPromotion();
    initNfc();
    
    return () => {
      NfcManager.cancelTechnologyRequest();
    };
  }, [business]);

  const loadPromotion = async () => {
    try {
      if (!business?.dispenserName) {
        setPromotionError('Dispenser information is missing');
        setLoadingPromotion(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/drink-dispenser/promotion?placeId=${business.placeId}&dispenserName=${encodeURIComponent(business.dispenserName)}`
      );

      if (response.ok) {
        const data = await response.json();
        setPromotion(data);
      } else if (response.status === 404) {
        setPromotionError('No promotion configured for this dispenser. Please set up a promotion first.');
      } else {
        setPromotionError('Failed to load promotion details');
      }
    } catch (error) {
      console.error('Error loading promotion:', error);
      setPromotionError('Failed to connect to promotion service');
    } finally {
      setLoadingPromotion(false);
    }
  };

  const initNfc = async () => {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        setNfcReady(true);
        startNfcListening();
      } else {
        Alert.alert('NFC Not Supported', 'This device does not support NFC');
      }
    } catch (error) {
      console.error('NFC init failed', error);
      Alert.alert('NFC Error', 'Failed to initialize NFC');
    }
  };

  const startNfcListening = async () => {
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA, {
        alertMessage: 'Tap the drink dispenser NFC tag!',
      });

      const tag = await NfcManager.getTag();
      if (tag) {
        handleNfcTagDetected();
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled') {
        console.error('NFC read error:', error);
      }
    } finally {
      NfcManager.cancelTechnologyRequest();
      setTimeout(() => {
        startNfcListening();
      }, 500);
    }
  };

  const handleNfcTagDetected = async () => {
    const now = Date.now();
    if (now - lastTapTime < 1000) {
      return;
    }
    setLastTapTime(now);

    if (!customerId) {
      setShowCustomerInput(true);
      Alert.alert(
        'Customer ID Required',
        'Please enter your phone number or email to continue',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isSpinning && promotion?.enabled && !inCooldown) {
      await spinTheWheel();
    }
  };

  const determineWinResult = (): { won: boolean; prize: PrizeOption | null } => {
    if (!promotion?.prizeOptions?.length) {
      const won = Math.random() < promotion!.winOdds;
      return { won, prize: null };
    }

    let totalProbability = 0;
    const random = Math.random();

    for (const prize of promotion.prizeOptions) {
      totalProbability += prize.probability;
      if (random < totalProbability) {
        return { won: true, prize };
      }
    }

    return { won: false, prize: null };
  };

  const recordSpin = async (won: boolean, wonPrize?: PrizeOption) => {
    try {
      const response = await fetch(`${API_URL}/drink-dispenser/spins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: promotion!.id,
          placeId: business.placeId,
          businessName: business.name,
          dispenserName: promotion!.dispenserName,
          customerId,
          customerType: customerId.includes('@') ? 'email' : 'phone',
          won,
          prizeName: wonPrize?.name || promotion!.prizeName,
          prizeType: wonPrize?.type || promotion!.prizeType,
          prizeValue: wonPrize?.value || promotion!.prizeValue,
          prizeEmoji: wonPrize?.emoji || promotion!.prizeEmoji,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        // Cooldown or limit reached
        setInCooldown(true);
        setCooldownMessage(data.message || 'Please wait before spinning again');
        Alert.alert('Cooldown Period', data.message);
        return false;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record spin');
      }

      return true;
    } catch (error) {
      console.error('Error recording spin:', error);
      Alert.alert('Error', 'Failed to record spin. Please try again.');
      return false;
    }
  };

  const spinTheWheel = async () => {
    if (isSpinning || !promotion?.enabled || inCooldown) return;

    setIsSpinning(true);
    setShowResult(false);

    const finalLeft = Math.floor(Math.random() * PRIZES.length);
    const finalCenter = Math.floor(Math.random() * PRIZES.length);
    const finalRight = Math.floor(Math.random() * PRIZES.length);

    const leftDistance = -(finalLeft * ROLLER_ITEM_HEIGHT + 3 * PRIZES.length * ROLLER_ITEM_HEIGHT);
    const centerDistance = -(finalCenter * ROLLER_ITEM_HEIGHT + 3 * PRIZES.length * ROLLER_ITEM_HEIGHT);
    const rightDistance = -(finalRight * ROLLER_ITEM_HEIGHT + 3 * PRIZES.length * ROLLER_ITEM_HEIGHT);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(leftRoller, {
          toValue: leftDistance,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(centerRoller, {
          toValue: centerDistance,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(rightRoller, {
          toValue: rightDistance,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(async () => {
      setIsSpinning(false);

      const { won, prize } = determineWinResult();

      if (won && prize) {
        const success = await recordSpin(true, prize);
        if (success) {
          setResult(prize.name);
          setShowResult(true);

          if (prize.type === 'cash') {
            Alert.alert('🎉 CASH WINNER!', `You won: £${prize.value}!\n\n${prize.name}\n\nShow this to staff to claim your prize!`);
          } else if (prize.type === 'discount') {
            Alert.alert('🎉 DISCOUNT!', `You won: ${prize.value}% off!\n\n${prize.name}\n\nShow this to staff!`);
          } else {
            Alert.alert('🎉 WINNER!', `You won: ${prize.name}!\n\nShow this to staff to claim!`);
          }
        }
      } else {
        const success = await recordSpin(false);
        if (success) {
          setResult(null);
          setShowResult(true);
          Alert.alert('Better Luck Next Time!', 'Try again on your next visit!');
        }
      }

      setTimeout(() => {
        leftRoller.setValue(0);
        centerRoller.setValue(0);
        rightRoller.setValue(0);
        setShowResult(false);
      }, 3000);
    });
  };

  const RollerColumn = ({ animatedValue, label }: { animatedValue: Animated.Value; label: string }) => {
    return (
      <View style={styles.rollerContainer}>
        <Text style={styles.rollerLabel}>{label}</Text>
        <View style={styles.rollerWindow}>
          <Animated.View
            style={[
              styles.rollerContent,
              {
                transform: [{ translateY: animatedValue }],
              },
            ]}
          >
            {Array.from({ length: 5 }).map((_, iteration) =>
              PRIZES.map((prize, index) => (
                <View key={`${iteration}-${index}`} style={styles.rollerItem}>
                  <Text style={styles.rollerEmoji}>{prize}</Text>
                </View>
              ))
            )}
          </Animated.View>
        </View>
      </View>
    );
  };

  if (loadingPromotion) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.statusText}>Loading promotion details...</Text>
        </View>
      </View>
    );
  }

  if (promotionError || !promotion) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.errorTitle}>⚠️ Setup Required</Text>
          <Text style={styles.errorText}>{promotionError || 'Promotion not configured'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!promotion.enabled) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.errorTitle}>❌ Promotion Disabled</Text>
          <Text style={styles.errorText}>This promotion is currently disabled</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍺 Tap & Win 🍺</Text>
        <Text style={styles.drinkName}>{promotion.drinkName}</Text>
        <Text style={styles.dispenserName}>{promotion.dispenserName}</Text>
        <Text style={styles.subtitle}>Win {promotion.prizeName}!</Text>
        {promotion.prizeDescription && (
          <Text style={styles.prizeDescription}>{promotion.prizeDescription}</Text>
        )}
        {business && <Text style={styles.business}>{business.name}</Text>}
      </View>

      {showCustomerInput && (
        <View style={styles.customerInputContainer}>
          <Text style={styles.inputLabel}>Enter your phone number or email:</Text>
          <TextInput
            style={styles.customerInput}
            placeholder="Phone or Email"
            placeholderTextColor="#999"
            value={customerId}
            onChangeText={setCustomerId}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              if (customerId) {
                setShowCustomerInput(false);
              } else {
                Alert.alert('Required', 'Please enter your phone number or email');
              }
            }}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showCustomerInput && !nfcReady ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.statusText}>Initializing NFC...</Text>
        </View>
      ) : !showCustomerInput && (
        <>
          <View style={styles.machineContainer}>
            <View style={styles.machineBody}>
              <RollerColumn animatedValue={leftRoller} label="1" />
              <RollerColumn animatedValue={centerRoller} label="2" />
              <RollerColumn animatedValue={rightRoller} label="3" />
            </View>

            {showResult && !isSpinning && (
              <View style={styles.resultOverlay}>
                {result ? (
                  <>
                    <Text style={styles.resultText}>WINNER!</Text>
                    <Text style={styles.resultGiftEmoji}>{promotion.prizeEmoji}</Text>
                    <Text style={styles.resultGiftName}>{result}</Text>
                    {promotion.prizeValue && (
                      <Text style={styles.resultGiftValue}>{promotion.prizeValue}</Text>
                    )}
                    <Text style={styles.claimText}>Show to staff to claim!</Text>
                  </>
                ) : (
                  <Text style={styles.resultText}>Try again on your next visit!</Text>
                )}
              </View>
            )}

            {isSpinning && (
              <View style={styles.spinningOverlay}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.spinningText}>Rolling...</Text>
              </View>
            )}
          </View>

          {inCooldown && (
            <View style={styles.cooldownBanner}>
              <Text style={styles.cooldownText}>⏳ {cooldownMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.spinButton, (isSpinning || !promotion.enabled || inCooldown || !customerId) && styles.spinButtonDisabled]}
            onPress={spinTheWheel}
            disabled={isSpinning || !promotion.enabled || inCooldown || !customerId}
          >
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'Spinning...' : inCooldown ? 'In Cooldown' : 'SPIN'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.instructionText}>
              {nfcReady ? '📱 Tap NFC tag on dispenser or press SPIN' : 'Initializing...'}
            </Text>
            <Text style={styles.cooldownInfo}>
              ⏰ {promotion.cooldownHours}h cooldown per dispenser
            </Text>
            {customerId && (
              <Text style={styles.customerInfo}>
                Logged in as: {customerId.substring(0, 15)}...
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  drinkName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00D4FF',
    marginBottom: 3,
  },
  dispenserName: {
    fontSize: 16,
    color: '#FFB366',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 15,
    color: '#FFD700',
    marginBottom: 8,
  },
  prizeDescription: {
    fontSize: 13,
    color: '#FFB366',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  business: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customerInputContainer: {
    paddingHorizontal: 30,
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 10,
    fontWeight: '600',
  },
  customerInput: {
    backgroundColor: '#0F3460',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  machineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  machineBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
  },
  rollerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  rollerLabel: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rollerWindow: {
    width: 80,
    height: ROLLER_ITEM_HEIGHT,
    backgroundColor: '#0F3460',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rollerContent: {
    alignItems: 'center',
  },
  rollerItem: {
    height: ROLLER_ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#162A47',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
  },
  rollerEmoji: {
    fontSize: 44,
  },
  spinButton: {
    marginHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  spinButtonDisabled: {
    backgroundColor: '#666',
    borderColor: '#444',
  },
  spinButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  spinningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  spinningText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.95)',
    borderRadius: 20,
    padding: 15,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  resultGiftEmoji: {
    fontSize: 70,
    marginBottom: 12,
  },
  resultGiftName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultGiftValue: {
    fontSize: 17,
    color: '#FFD700',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  claimText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  cooldownBanner: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cooldownText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#00D4FF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cooldownInfo: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 6,
  },
  customerInfo: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statusText: {
    fontSize: 15,
    color: '#FFD700',
    marginTop: 10,
  },
});

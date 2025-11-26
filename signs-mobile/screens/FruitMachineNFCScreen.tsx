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
  Image,
} from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Audio } from 'expo-av';
import PLATFORM_ICONS from '../assets/platform-icons';

interface FruitMachineNFCScreenProps {
  navigation: any;
  route: any;
}

interface PrizeOption {
  id: string;
  type: 'gift' | 'cash';
  name: string;
  emoji: string;
  value: string | number;
  probability: number;
  imageUrl?: string;
}

interface FruitMachinePromotion {
  id: string;
  placeId: string;
  businessName: string;
  giftName: string;
  giftDescription?: string;
  giftEmoji: string;
  giftValue?: string;
  giftImageUrl?: string;
  enabled: boolean;
  maxUsesPerDay?: number;
  usesRemainingToday: number;
  enableCashPrizes?: boolean;
  prizeOptions?: PrizeOption[];
  defaultWinOdds?: number;
  totalCashBudgetPerMonth?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Prize items that can appear on the roller
const PRIZES = ['🎁', '💰', '⭐', '🏆', '🎉', '💎', '🎊', '🍀'];
const ROLLER_ITEM_HEIGHT = 80;
const ITEMS_PER_ROLLER = 8;

// API URL - use environment variable or default to network IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.110:3000/api';

export default function FruitMachineNFCScreen({ navigation, route }: FruitMachineNFCScreenProps) {
  const { business, reviewUrl, promotionId, placeId } = route?.params || {};

  // Log params for debugging
  useEffect(() => {
    console.log('FruitMachineNFCScreen received params:', {
      business,
      promotionId,
      placeId,
      allParams: route?.params
    });
  }, [route?.params]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [nfcReady, setNfcReady] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [promotion, setPromotion] = useState<FruitMachinePromotion | null>(null);
  const [loadingPromotion, setLoadingPromotion] = useState(true);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState(business || null);

  // Sound refs
  const spinSoundRef = useRef<Audio.Sound | null>(null);

  const playSpinSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/spin.wav')
      );
      spinSoundRef.current = sound;
      await sound.setIsLoopingAsync(true);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing spin sound', error);
    }
  };

  const stopSpinSound = async () => {
    try {
      if (spinSoundRef.current) {
        await spinSoundRef.current.stopAsync();
        await spinSoundRef.current.unloadAsync();
        spinSoundRef.current = null;
      }
    } catch (error) {
      console.log('Error stopping spin sound', error);
    }
  };

  const playEffect = async (effect: 'stop' | 'win') => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        effect === 'stop' ? require('../assets/sounds/stop.wav') :
        require('../assets/sounds/win.wav')
      );
      await sound.playAsync();
      // Unload after playback
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing effect', error);
    }
  };

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      if (spinSoundRef.current) {
        spinSoundRef.current.unloadAsync();
      }
    };
  }, []);

  // Animated values for each roller (left, center, right)
  const leftRoller = useRef(new Animated.Value(0)).current;
  const centerRoller = useRef(new Animated.Value(0)).current;
  const rightRoller = useRef(new Animated.Value(0)).current;

  const rollerItems = React.useMemo(() => {
    const items = [...PRIZES];
    if (promotion?.giftEmoji) {
      // Replace the generic gift box with the specific gift emoji/icon
      items[0] = promotion.giftEmoji;
    }
    return items;
  }, [promotion?.giftEmoji]);

  useEffect(() => {
    // Load promotion details
    loadPromotion();
    
    // Initialize NFC
    initNfc();
    
    return () => {
      NfcManager.cancelTechnologyRequest();
    };
  }, [business, promotionId, placeId]);

  const loadPromotion = async () => {
    try {
      // Determine the placeId to use (from business or from deep link params)
      const targetPlaceId = business?.placeId || placeId;
      
      if (!targetPlaceId) {
        setPromotionError('Business place ID is missing');
        setLoadingPromotion(false);
        return;
      }

      // If we have a promotionId from deep link, fetch that specific promotion
      if (promotionId) {
        try {
          const response = await fetch(`${API_URL}/fruit-machine/promotion/${promotionId}`);
          if (response.ok) {
            const data = await response.json();
            setPromotion(data);
            setLoadingPromotion(false);
            return;
          }
        } catch (error) {
          console.warn('Could not fetch promotion by ID, trying by place ID:', error);
        }
      }

      // Fallback: fetch promotion by place ID
      const response = await fetch(
        `${API_URL}/fruit-machine/promotion?placeId=${targetPlaceId}`
      );

      if (response.ok) {
        const data = await response.json();
        setPromotion(data);
      } else if (response.status === 404) {
        setPromotionError('No promotion configured for this business. Please set up a promotion first.');
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
      // Request NDEF technology to properly read NDEF-formatted messages
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Tap NFC tag to spin the wheel!',
      });

      const tag = await NfcManager.getTag();
      console.log('NFC tag detected:', JSON.stringify(tag, null, 2));
      
      if (tag) {
        handleNfcTagDetected(tag);
      }
    } catch (error: any) {
      // Try NfcA as fallback if NDEF fails
      if (error.message?.includes('NDEF')) {
        console.log('NDEF not supported, trying NfcA technology');
        try {
          await NfcManager.requestTechnology(NfcTech.NfcA, {
            alertMessage: 'Tap NFC tag to spin the wheel!',
          });

          const tag = await NfcManager.getTag();
          if (tag) {
            handleNfcTagDetected(tag);
          }
        } catch (nfcAError) {
          console.error('NFC read error:', nfcAError);
        }
      } else if (error.message !== 'User cancelled') {
        console.error('NFC read error:', error);
      }
    } finally {
      NfcManager.cancelTechnologyRequest();
      // Restart listening after a delay
      setTimeout(() => {
        startNfcListening();
      }, 500);
    }
  };

  const handleNfcTagDetected = async (tag?: any) => {
    const now = Date.now();
    if (now - lastTapTime < 1000) {
      return; // Ignore rapid successive taps
    }
    setLastTapTime(now);

    if (!isSpinning && promotion?.enabled) {
      await spinTheWheel();
    }
  };

  const recordSpin = async (won: boolean, resultEmoji: string | null, wonPrize?: PrizeOption) => {
    try {
      const targetPlaceId = business?.placeId || placeId || promotion?.placeId;
      const targetBusinessName = business?.name || promotion?.businessName || 'Unknown';

      const body: any = {
        placeId: targetPlaceId,
        businessName: targetBusinessName,
        won,
        resultEmoji,
        spinStartedAt: new Date(),
        spinCompletedAt: new Date(),
      };

      // Include prize details if cash prize was won
      if (wonPrize && wonPrize.type === 'cash') {
        body.cashWon = true;
        body.prizeType = 'cash';
        body.prizeAmount = wonPrize.value;
        body.prizeName = wonPrize.name;
      }

      const response = await fetch(`${API_URL}/fruit-machine/spins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // If cash prize, attempt to create payout record
      if (wonPrize?.type === 'cash' && response.ok) {
        try {
          await fetch(`${API_URL}/fruit-machine/payouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              promotionId: promotion?.id,
              amount: wonPrize.value,
              prizeType: 'cash',
              prizeName: wonPrize.name,
              status: 'pending',
            }),
          });
        } catch (error) {
          console.error('Error recording payout:', error);
        }
      }
    } catch (error) {
      console.error('Error recording spin:', error);
    }
  };

  const determineWinResult = (): { won: boolean; prize: PrizeOption | null } => {
    if (!promotion?.enableCashPrizes || !promotion.prizeOptions?.length) {
      // Legacy behavior: simple win/loss
      const winOdds = promotion?.defaultWinOdds || 0.004; // 1 in 250
      const won = Math.random() < winOdds;
      return { won, prize: null };
    }

    // Calculate cumulative probabilities for prize selection
    let totalProbability = 0;
    const random = Math.random();

    for (const prize of promotion.prizeOptions) {
      totalProbability += prize.probability;
      if (random < totalProbability) {
        return { won: true, prize };
      }
    }

    // No prize won
    return { won: false, prize: null };
  };

  const spinTheWheel = async () => {
    if (isSpinning || !promotion?.enabled) return;

    setIsSpinning(true);
    setShowResult(false);
    playSpinSound();

    // Generate random final positions
    const finalLeft = Math.floor(Math.random() * PRIZES.length);
    const finalCenter = Math.floor(Math.random() * PRIZES.length);
    const finalRight = Math.floor(Math.random() * PRIZES.length);

    // Calculate rotation distances (at least 3 full rotations)
    const leftDistance = -(finalLeft * ROLLER_ITEM_HEIGHT + 3 * ITEMS_PER_ROLLER * ROLLER_ITEM_HEIGHT);
    const centerDistance = -(finalCenter * ROLLER_ITEM_HEIGHT + 3 * ITEMS_PER_ROLLER * ROLLER_ITEM_HEIGHT);
    const rightDistance = -(finalRight * ROLLER_ITEM_HEIGHT + 3 * ITEMS_PER_ROLLER * ROLLER_ITEM_HEIGHT);

    // Schedule stop sounds (based on sequential animation durations: 800, 1000, 1200)
    setTimeout(() => playEffect('stop'), 800);
    setTimeout(() => playEffect('stop'), 1800);
    setTimeout(() => playEffect('stop'), 3000);

    // Stagger the animations for effect
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
    ]).start(() => {
      setIsSpinning(false);
      stopSpinSound();

      // Determine if player won and what prize
      const { won, prize } = determineWinResult();

      if (won && prize) {
        playEffect('win');
        setResult(prize.name);
        setShowResult(true);
        recordSpin(true, prize.emoji, prize);

        if (prize.type === 'cash') {
          Alert.alert(
            '🎉 CASH WINNER!',
            `You won: £${prize.value}!\n\n${prize.name}`
          );
        } else {
          Alert.alert(
            '🎉 WINNER!',
            `You won: ${promotion?.giftName}!\n\n${promotion?.giftDescription || 'Congratulations!'}`
          );
        }
      } else {
        setResult(null);
        setShowResult(true);
        recordSpin(false, null);
      }

      // Reset animation values
      setTimeout(() => {
        leftRoller.setValue(0);
        centerRoller.setValue(0);
        rightRoller.setValue(0);
        setShowResult(false);
      }, 2000);
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
            {/* Render items multiple times for infinite effect */}
            {Array.from({ length: 5 }).map((_, iteration) =>
              rollerItems.map((prize, index) => (
                <View
                  key={`${iteration}-${index}`}
                  style={styles.rollerItem}
                >
                  {PLATFORM_ICONS[prize] ? (
                    <Image source={PLATFORM_ICONS[prize]} style={styles.rollerIcon} />
                  ) : (
                    <Text style={styles.rollerEmoji}>{prize}</Text>
                  )}
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎰 Spin To Win 🎰</Text>
        {promotion?.enableCashPrizes ? (
          <>
            <Text style={styles.subtitle}>Win Cash Prizes!</Text>
            <Text style={styles.giftDescription}>Spin for your chance to win up to £{Math.max(...(promotion.prizeOptions?.filter(p => p.type === 'cash').map(p => p.value as number) || [0]))}</Text>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Win {promotion.giftName}!</Text>
            <Text style={styles.giftDescription}>{promotion.giftDescription}</Text>
          </>
        )}
        {business && <Text style={styles.business}>{business.name}</Text>}
      </View>

      {!nfcReady ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.statusText}>Initializing NFC...</Text>
        </View>
      ) : (
        <>
          {/* Fruit Machine Display */}
          <View style={styles.machineContainer}>
            <View style={styles.machineBody}>
              <RollerColumn animatedValue={leftRoller} label="1" />
              <RollerColumn animatedValue={centerRoller} label="2" />
              <RollerColumn animatedValue={rightRoller} label="3" />
            </View>

            {/* Win Display */}
            {showResult && !isSpinning && (
              <View style={styles.resultOverlay}>
                {result ? (
                  <>
                    <Text style={styles.resultText}>WINNER!</Text>
                    {/* Check if it's a cash prize */}
                    {promotion?.prizeOptions?.some((p) => p.name === result && p.type === 'cash') ? (
                      <>
                        <Text style={styles.resultGiftEmoji}>💰</Text>
                        <Text style={styles.resultGiftName}>{result}</Text>
                      </>
                    ) : (
                      <>
                        {promotion?.giftEmoji && PLATFORM_ICONS[promotion.giftEmoji] ? (
                          <Image source={PLATFORM_ICONS[promotion.giftEmoji]} style={styles.resultGiftIcon} />
                        ) : (
                          <Text style={styles.resultGiftEmoji}>{promotion?.giftEmoji}</Text>
                        )}
                        <Text style={styles.resultGiftName}>{promotion?.giftName}</Text>
                        {promotion?.giftValue && (
                          <Text style={styles.resultGiftValue}>{promotion.giftValue}</Text>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <Text style={styles.resultText}>Try again!</Text>
                )}
              </View>
            )}

            {/* Spinning Indicator */}
            {isSpinning && (
              <View style={styles.spinningOverlay}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.spinningText}>Rolling...</Text>
              </View>
            )}
          </View>

          {/* Manual Spin Button */}
          <TouchableOpacity
            style={[styles.spinButton, (isSpinning || !promotion.enabled) && styles.spinButtonDisabled]}
            onPress={spinTheWheel}
            disabled={isSpinning || !promotion.enabled}
          >
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'Spinning...' : 'SPIN'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.instructionText}>
              {nfcReady ? '📱 Tap NFC tag or press SPIN button' : 'Initializing...'}
            </Text>
            {promotion.maxUsesPerDay && (
              <Text style={styles.limitText}>
                Today: {promotion.usesRemainingToday}/{promotion.maxUsesPerDay} spins
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
    paddingVertical: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 10,
  },
  giftDescription: {
    fontSize: 14,
    color: '#FFB366',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  business: {
    fontSize: 18,
    color: '#00D4FF',
    fontWeight: '600',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
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
  machineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
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
    fontSize: 14,
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
    fontSize: 48,
  },
  spinButton: {
    marginHorizontal: 40,
    paddingVertical: 18,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  spinButtonDisabled: {
    backgroundColor: '#999',
    borderColor: '#666',
  },
  spinButtonText: {
    fontSize: 24,
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
    fontSize: 18,
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
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    borderRadius: 20,
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  resultGiftEmoji: {
    fontSize: 80,
    marginBottom: 15,
  },
  resultGiftName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  resultGiftValue: {
    fontSize: 18,
    color: '#FFD700',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#00D4FF',
    fontStyle: 'italic',
  },
  limitText: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 10,
  },
  rollerIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  resultGiftIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
});

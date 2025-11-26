import os
import urllib.request
import urllib.error

LOGOS_DIR = '/Users/admin/Development/signs-app/signs-mobile/assets/platform-logos'

# Ensure directory exists
os.makedirs(LOGOS_DIR, exist_ok=True)

logos = {
    'facebook.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/1024px-2021_Facebook_icon.svg.png',
    'instagram.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1024px-Instagram_logo_2016.svg.png',
    'tiktok.png': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/1024px-TikTok_logo.svg.png',
    'linkedin.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/600px-LinkedIn_logo_initials.png',
    'google.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png',
    'tripadvisor.png': 'https://logo.clearbit.com/tripadvisor.com',
    'trustpilot.png': 'https://logo.clearbit.com/trustpilot.com',
    'yell.png': 'https://logo.clearbit.com/yell.com',
    'yelp.png': 'https://logo.clearbit.com/yelp.com',
    'checkatrade.png': 'https://logo.clearbit.com/checkatrade.com', 
    'ratedpeople.png': 'https://logo.clearbit.com/ratedpeople.com',
    'trustatrader.png': 'https://logo.clearbit.com/trustatrader.com',
    'twitter.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/1200px-X_logo_2023.svg.png'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
}

for filename, url in logos.items():
    filepath = os.path.join(LOGOS_DIR, filename)
    # Always overwrite to get the latest/fixed versions
    print(f"Downloading {filename} from {url}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
            print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

print("Download complete.")

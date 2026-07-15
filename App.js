import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Dimensions, Platform, Animated, TouchableWithoutFeedback } from 'react-native';

const FloatingClick = ({ x, y }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.Text style={{
      position: 'absolute',
      left: x - 15,
      top: y - 15,
      color: 'white',
      fontSize: 30,
      fontWeight: 'bold',
      opacity: opacity,
      transform: [{ translateY }]
    }}>
      +10
    </Animated.Text>
  );
};
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function App() {
  const [balance, setBalance] = useState(20000000);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [clicks, setClicks] = useState([]);
  const [activeTab, setActiveTab] = useState('Exchange');
  const [showTapsLeft, setShowTapsLeft] = useState(false);

  const getRank = (bal) => {
    const rankConfigs = [
      { name: 'Bronze', icon: 'medal', color: '#CD7F32' },
      { name: 'Silver', icon: 'medal', color: '#C0C0C0' },
      { name: 'Gold', icon: 'medal', color: '#FFD700' },
      { name: 'Platinum', icon: 'gem', color: '#E5E4E2' },
      { name: 'Diamond', icon: 'gem', color: '#b9f2ff' },
      { name: 'Crown', icon: 'crown', color: '#FFDF00' },
    ];
    
    const getCumulativeCost = (L) => {
      if (L <= 1) return 0;
      return 3000 * (L - 1) + 1000 * (L - 1) * (L - 2);
    };

    let L = 1;
    while (L <= 18) {
      const currentLevelCost = getCumulativeCost(L);
      const nextLevelCost = getCumulativeCost(L + 1);
      
      if (bal >= currentLevelCost && bal < nextLevelCost) {
        const rankIndex = Math.floor((L - 1) / 3);
        const subLevel = ((L - 1) % 3) + 1;
        const config = rankConfigs[rankIndex];
        return { name: config.name, level: subLevel, min: currentLevelCost, max: nextLevelCost, icon: config.icon, color: config.color };
      }
      L++;
    }
    
    // Ace
    const aceBaseCumulative = getCumulativeCost(19);
    const aceStep = 100000000;
    const aceLevel = Math.max(1, Math.floor((bal - aceBaseCumulative) / aceStep) + 1);
    const currentMin = aceBaseCumulative + (aceLevel - 1) * aceStep;
    const currentMax = currentMin + aceStep;
    
    return { name: 'Ace', level: aceLevel, min: currentMin, max: currentMax, icon: 'trophy', color: '#FF4500' };
  };

  const currentRank = getRank(balance);
  const progressPercent = Math.min(100, Math.max(0, ((balance - currentRank.min) / (currentRank.max - currentRank.min)) * 100));

  const handleTap = (e) => {
    // Increase balance
    setBalance(prev => prev + 10);

    const { locationX, locationY } = e.nativeEvent;
    const id = Date.now().toString() + Math.random().toString();
    setClicks(prev => [...prev, { id, x: locationX, y: locationY }]);

    // Remove click after animation
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 1000);

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <LinearGradient
      colors={['#182F58', '#0D162B', '#070C18']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        
        {/* Main Content Area */}
        {activeTab === 'Exchange' ? (
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>The Hedgehog</Text>
                <View style={styles.titleUnderline} />
              </View>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="grid-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Earn per tap</Text>
                <View style={styles.statValueRow}>
                  <Image source={require('./assets/coin.png')} style={styles.tinyCoin} />
                  <Text style={styles.statValue}>+10</Text>
                </View>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Coin to levelup</Text>
                <Text style={styles.statValueText}>100M</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, {color: '#4ADE80'}]}>Profit per Hour</Text>
                <View style={styles.statValueRow}>
                  <Image source={require('./assets/coin.png')} style={styles.tinyCoin} />
                  <Text style={styles.statValue}>+100K</Text>
                </View>
              </View>
            </View>

            {/* Balance */}
            <View style={styles.balanceContainer}>
              <Image 
                source={require('./assets/coin.png')} 
                style={styles.bigCoin} 
              />
              <Text style={styles.balanceText}>{formatNumber(balance)}</Text>
            </View>

            {/* Level & Progress */}
            <TouchableOpacity 
              style={styles.levelContainer}
              onPress={() => setShowTapsLeft(!showTapsLeft)}
              activeOpacity={0.8}
            >
              <View style={styles.levelHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name={currentRank.icon} size={14} color={currentRank.color} style={{ marginRight: 6 }} />
                  <Text style={styles.levelName}>{currentRank.name} {currentRank.level} {">"}</Text>
                </View>
                <Text style={styles.levelCount}>
                  {showTapsLeft 
                    ? `Need ${formatNumber(currentRank.max - balance)} taps`
                    : `${formatNumber(balance)} / ${formatNumber(currentRank.max)}`
                  }
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#FF6B6B', '#FFB86C']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                />
              </View>
            </TouchableOpacity>

            {/* Character Area */}
            <View style={styles.characterContainer}>
              <View style={styles.glowCircle} />
              <View style={styles.innerCircle}>
                <TouchableWithoutFeedback onPress={handleTap}>
                  <View style={{ width: '100%', height: '100%', borderRadius: width * 0.375, overflow: 'hidden' }}>
                    <Animated.Image 
                      source={require('./assets/hedgehog.png')} 
                      style={[styles.characterImage, { transform: [{ scale: scaleValue }] }]} 
                      resizeMode="cover"
                    />
                    {clicks.map(c => (
                      <FloatingClick key={c.id} x={c.x} y={c.y} />
                    ))}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
        ) : activeTab === 'Mine' ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <MaterialCommunityIcons name="pickaxe" size={64} color="#FFB86C" />
             <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 20 }}>Mine (Upgrades)</Text>
             <Text style={{ color: '#94A3B8', marginTop: 10 }}>Hamster Kombat Upgrades coming soon...</Text>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>{activeTab}</Text>
          </View>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={activeTab === 'Exchange' ? styles.navItemActive : styles.navItem}
            onPress={() => setActiveTab('Exchange')}
          >
            <Ionicons name="swap-horizontal" size={24} color={activeTab === 'Exchange' ? "#FFF" : "#94A3B8"} />
            <Text style={activeTab === 'Exchange' ? styles.navTextActive : styles.navText}>Exchange</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'Mine' ? styles.navItemActive : styles.navItem}
            onPress={() => setActiveTab('Mine')}
          >
            <MaterialCommunityIcons name="pickaxe" size={24} color={activeTab === 'Mine' ? "#FFF" : "#94A3B8"} />
            <Text style={activeTab === 'Mine' ? styles.navTextActive : styles.navText}>Mine</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'Friends' ? styles.navItemActive : styles.navItem}
            onPress={() => setActiveTab('Friends')}
          >
            <FontAwesome5 name="user-friends" size={20} color={activeTab === 'Friends' ? "#FFF" : "#94A3B8"} />
            <Text style={activeTab === 'Friends' ? styles.navTextActive : styles.navText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'Earn' ? styles.navItemActive : styles.navItem}
            onPress={() => setActiveTab('Earn')}
          >
            <FontAwesome5 name="coins" size={20} color={activeTab === 'Earn' ? "#FFF" : "#94A3B8"} />
            <Text style={activeTab === 'Earn' ? styles.navTextActive : styles.navText}>Earn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={activeTab === 'Airdrop' ? styles.navItemActive : styles.navItem}
            onPress={() => setActiveTab('Airdrop')}
          >
             <Image source={require('./assets/hedgehog.png')} style={styles.navTinyIcon} />
            <Text style={activeTab === 'Airdrop' ? styles.navTextActive : styles.navText}>Airdrop</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  titleUnderline: {
    height: 2,
    width: '60%',
    backgroundColor: '#FFB86C',
    marginTop: 4,
    borderRadius: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tinyCoin: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statValueText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  bigCoin: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  balanceText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  levelContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  levelCount: {
    color: '#94A3B8',
    fontSize: 12,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '80%',
    height: '100%',
    borderRadius: 5,
  },
  characterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  innerCircle: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  characterImage: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.375,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  navText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  navTextActive: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 4,
  },
  navTinyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Dimensions, Platform, Animated, TouchableWithoutFeedback, Modal, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const FloatingClick = ({ x, y, val }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
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
      +{val}
    </Animated.Text>
  );
};

const { width, height } = Dimensions.get('window');

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
  if (L === 2) return 1000;
  if (L === 3) return 5000;
  
  let cost = 5000;
  let currentGap = 4000;
  
  for (let i = 4; i <= L; i++) {
    currentGap += 3625;
    cost += currentGap;
  }
  return Math.round(cost / 100) * 100; // Round to nearest 100 for clean numbers
};

const ALL_RANKS = [];
for (let L = 1; L <= 18; L++) {
  const rankIndex = Math.floor((L - 1) / 3);
  const subLevel = ((L - 1) % 3) + 1;
  ALL_RANKS.push({
    globalLevel: L,
    name: rankConfigs[rankIndex].name,
    level: subLevel,
    icon: rankConfigs[rankIndex].icon,
    color: rankConfigs[rankIndex].color,
    cost: getCumulativeCost(L)
  });
}
ALL_RANKS.push({
  globalLevel: 19,
  name: 'Ace',
  level: '',
  icon: 'trophy',
  color: '#FF4500',
  cost: getCumulativeCost(19),
  isAce: true
});

const RANK_IMAGES = [
  require('./assets/hamster_1.png'), // Bronze (levels 1-3)
  require('./assets/hamster_2.png'), // Silver (levels 4-6)
  require('./assets/hamster_3.png'), // Gold   (levels 7-9)
  require('./assets/hamster_4.png'), // Platinum (levels 10-12)
  require('./assets/hamster_5.png'), // Diamond (levels 13-15)
  require('./assets/hamster_6.png'), // Crown  (levels 16-18)
  require('./assets/hedgehog.png'),  // Ace    (level 19+)
];

import { supabase } from '../supabase';

export default function GameScreen({ navigation }) {
  const [balance, setBalance] = useState(1);
  const [energy, setEnergy] = useState(2000);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [clicks, setClicks] = useState([]);
  const [activeTab, setActiveTab] = useState('Exchange');
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState([]);

  const [isLoaded, setIsLoaded] = useState(false);

  const AVAILABLE_UPGRADES = [
    { id: '1', name: 'Multitap', cost: 500, icon: 'hand-pointer', description: '+1 Tap Value' },
    { id: '2', name: 'Energy Limit', cost: 1000, icon: 'battery-full', description: '+500 Max Energy' },
    { id: '3', name: 'Recharging Speed', cost: 2000, icon: 'bolt', description: '+1 Energy/sec' },
    { id: '4', name: 'Auto Bot', cost: 5000, icon: 'robot', description: 'Auto clicker' },
  ];

  const latestData = useRef({ balance: 1, energy: 2000 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch from Supabase profiles and inventory
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) {
            if (profile.balance !== null) setBalance(Number(profile.balance));
            if (profile.energy !== null) setEnergy(Number(profile.energy));
          }
          const { data: inventory } = await supabase.from('inventory').select('*').eq('user_id', user.id);
          if (inventory) {
            setPurchasedItems(inventory.map(item => ({ ...item, purchaseId: item.id })));
          }
        } else {
          // Local fallback
          const savedBalance = await SecureStore.getItemAsync('balance');
          const savedEnergy = await SecureStore.getItemAsync('energy');
          if (savedBalance !== null) setBalance(parseInt(savedBalance, 10));
          if (savedEnergy !== null) setEnergy(parseInt(savedEnergy, 10));
          const savedItems = await SecureStore.getItemAsync('purchasedItems');
          if (savedItems !== null) setPurchasedItems(JSON.parse(savedItems));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    latestData.current = { balance, energy };
    if (!isLoaded) return;
    const saveDataLocal = async () => {
      try {
        await SecureStore.setItemAsync('balance', balance.toString());
        await SecureStore.setItemAsync('energy', energy.toString());
        await SecureStore.setItemAsync('purchasedItems', JSON.stringify(purchasedItems));
      } catch (e) { }
    };
    saveDataLocal();
  }, [balance, energy, purchasedItems, isLoaded]);

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (!isLoaded) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await supabase.from('profiles').update({
            balance: latestData.current.balance,
            energy: latestData.current.energy
          }).eq('id', session.user.id);
        }
      } catch (e) { }
    }, 5000);
    return () => clearInterval(syncInterval);
  }, [isLoaded]);

  const getRank = (bal) => {

    let L = 1;
    while (L <= 18) {
      const currentLevelCost = getCumulativeCost(L);
      const nextLevelCost = getCumulativeCost(L + 1);
      
      if (bal >= currentLevelCost && bal < nextLevelCost) {
        const rankIndex = Math.floor((L - 1) / 3);
        const subLevel = ((L - 1) % 3) + 1;
        const config = rankConfigs[rankIndex];
        return { name: config.name, level: subLevel, globalLevel: L, min: currentLevelCost, max: nextLevelCost, icon: config.icon, color: config.color };
      }
      L++;
    }
    
    // Ace
    const aceBaseCumulative = getCumulativeCost(19);
    const aceStep = 100000000;
    const aceLevel = Math.max(1, Math.floor((bal - aceBaseCumulative) / aceStep) + 1);
    const currentMin = aceBaseCumulative + (aceLevel - 1) * aceStep;
    const currentMax = currentMin + aceStep;
    const globalLevel = 18 + aceLevel;
    
    return { name: 'Level', level: aceLevel, globalLevel, min: currentMin, max: currentMax, icon: 'trophy', color: '#FF4500' };
  };

  const currentRank = getRank(balance);
  const progressPercent = Math.min(100, Math.max(0, ((balance - currentRank.min) / (currentRank.max - currentRank.min)) * 100));
  const tapValue = Math.pow(2, currentRank.globalLevel - 1);
  const maxEnergy = currentRank.globalLevel * 2000;
  const rankImageIndex = currentRank.globalLevel >= 19 ? 6 : Math.floor((currentRank.globalLevel - 1) / 3);
  const characterImage = RANK_IMAGES[rankImageIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        const newEnergy = prev + 3; // Regenerate 3 per second
        return newEnergy > maxEnergy ? maxEnergy : newEnergy;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  const handleTap = (e) => {
    if (energy < tapValue) return; // Prevent tapping if not enough energy

    // Decrease energy and increase balance
    setEnergy(prev => prev - tapValue);
    setBalance(prev => prev + tapValue);

    const { locationX, locationY } = e.nativeEvent;
    const id = Date.now().toString() + Math.random().toString();
    setClicks(prev => [...prev, { id, x: locationX, y: locationY, val: tapValue }]);

    // Remove click after animation
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 1000);

    // No extra bounce needed here since handlePressIn/Out covers it
  };

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.92,
      duration: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
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
              <View style={[styles.titleContainer, { flex: 1 }]}>
                <Text style={styles.title}>The Hedgehog</Text>
                <View style={styles.titleUnderline} />
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Earn per tap</Text>
                <View style={styles.statValueRow}>
                  <Image source={require('./assets/coin.png')} style={styles.tinyCoin} />
                  <Text style={styles.statValue}>+{tapValue}</Text>
                </View>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Coin to levelup</Text>
                <Text style={styles.statValueText} adjustsFontSizeToFit numberOfLines={1}>
                  {formatNumber(balance)} / {formatNumber(currentRank.max)}
                </Text>
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
              onPress={() => setShowRanksModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.levelHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name={currentRank.icon} size={14} color={currentRank.color} style={{ marginRight: 6 }} />
                  <Text style={styles.levelName}>{currentRank.name} {currentRank.level} {">"}</Text>
                </View>
                <Text style={styles.levelCount}>
                  {formatNumber(balance)} / {formatNumber(currentRank.max)}
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
                      source={characterImage} 
                      style={[styles.characterImage, { transform: [{ scale: scaleValue }] }]} 
                      resizeMode="cover"
                    />
                    {clicks.map(c => (
                      <FloatingClick key={c.id} x={c.x} y={c.y} val={c.val} />
                    ))}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>

            {/* Energy UI */}
            <View style={styles.energyContainer}>
              <FontAwesome5 name="bolt" size={24} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.energyText}>
                {formatNumber(energy)} / {formatNumber(maxEnergy)}
              </Text>
            </View>

          </View>
        ) : activeTab === 'Mine' ? (
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', margin: 20 }}>Upgrades Store</Text>
            <ScrollView style={{ paddingHorizontal: 20 }}>
              {AVAILABLE_UPGRADES.map(item => (
                <View key={item.id} style={styles.upgradeItem}>
                  <View style={styles.upgradeIconBox}>
                    <FontAwesome5 name={item.icon} size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>{item.description}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.buyButton, balance < item.cost && { opacity: 0.5 }]}
                    onPress={async () => {
                      if (balance >= item.cost) {
                        setBalance(prev => prev - item.cost);
                        const newItem = { ...item, purchaseId: Date.now().toString() };
                        setPurchasedItems(prev => [...prev, newItem]);
                        
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (session && session.user) {
                            await supabase.from('inventory').insert([{
                              user_id: session.user.id,
                              item_id: item.id,
                              name: item.name,
                              cost: item.cost,
                              icon: item.icon
                            }]);
                          }
                        } catch (e) {
                          console.error('Purchase error', e);
                        }
                      }
                    }}
                    disabled={balance < item.cost}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.cost}</Text>
                    <Image source={require('./assets/coin.png')} style={{ width: 14, height: 14, marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : activeTab === 'Main' ? (
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', margin: 20 }}>My Inventory (Main)</Text>
            {purchasedItems.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome5 name="box-open" size={64} color="#94A3B8" />
                <Text style={{ color: '#94A3B8', marginTop: 20 }}>You haven't bought anything yet.</Text>
              </View>
            ) : (
              <ScrollView style={{ paddingHorizontal: 20 }}>
                {purchasedItems.map(item => (
                  <View key={item.purchaseId} style={styles.upgradeItem}>
                    <View style={styles.upgradeIconBox}>
                      <FontAwesome5 name={item.icon} size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                      <Text style={{ color: '#4ADE80', fontSize: 12 }}>Purchased</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
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
            style={activeTab === 'Main' ? styles.navItemActive : styles.navItem}
            onPress={() => setActiveTab('Main')}
          >
            <Ionicons name="home" size={20} color={activeTab === 'Main' ? "#FFF" : "#94A3B8"} />
            <Text style={activeTab === 'Main' ? styles.navTextActive : styles.navText}>Main</Text>
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

        {/* Ranks Modal */}
        <Modal
          visible={showRanksModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRanksModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Ranks</Text>
                <TouchableOpacity onPress={() => setShowRanksModal(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {ALL_RANKS.map((r, index) => {
                  const isCurrent = currentRank.globalLevel === r.globalLevel || (currentRank.globalLevel >= 19 && r.isAce);
                  return (
                    <View key={index} style={[styles.rankListItem, isCurrent && styles.rankListItemCurrent]}>
                      <View style={styles.rankListLeft}>
                        <FontAwesome5 name={r.icon} size={20} color={r.color} style={{ width: 30 }} />
                        <Text style={[styles.rankListName, isCurrent && styles.rankListNameCurrent]}>
                          {r.name} {r.level}
                        </Text>
                      </View>
                      <Text style={styles.rankListCost}>
                        {r.isAce ? `${formatNumber(r.cost)}+ taps` : `${formatNumber(r.cost)} taps`}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
    marginRight: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  rankListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rankListItemCurrent: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderBottomWidth: 0,
  },
  rankListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankListName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  rankListNameCurrent: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  rankListCost: {
    color: '#94A3B8',
    fontSize: 14,
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  energyText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  upgradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  upgradeIconBox: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

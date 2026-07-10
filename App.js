import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Dimensions, Platform, Animated, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function App() {
  const [balance, setBalance] = useState(20000000);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleTap = () => {
    // Increase balance
    setBalance(prev => prev + 10);

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
        <View style={styles.levelContainer}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelName}>Silver ></Text>
            <Text style={styles.levelCount}>Level 8/10</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={['#FF6B6B', '#FFB86C']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.progressBarFill}
            />
          </View>
        </View>

        {/* Character Area */}
        <View style={styles.characterContainer}>
          <View style={styles.glowCircle} />
          <View style={styles.innerCircle}>
            <TouchableWithoutFeedback onPress={handleTap}>
              <Animated.Image 
                source={require('./assets/hedgehog.png')} 
                style={[styles.characterImage, { transform: [{ scale: scaleValue }] }]} 
                resizeMode="contain"
              />
            </TouchableWithoutFeedback>
          </View>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItemActive}>
            <Ionicons name="swap-horizontal" size={24} color="#FFF" />
            <Text style={styles.navTextActive}>Exchange</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="pickaxe" size={24} color="#94A3B8" />
            <Text style={styles.navText}>Mine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="user-friends" size={20} color="#94A3B8" />
            <Text style={styles.navText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <FontAwesome5 name="coins" size={20} color="#94A3B8" />
            <Text style={styles.navText}>Earn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
             <Image source={require('./assets/hedgehog.png')} style={styles.navTinyIcon} />
            <Text style={styles.navText}>Airdrop</Text>
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
  },
  characterImage: {
    width: '100%',
    height: '100%',
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

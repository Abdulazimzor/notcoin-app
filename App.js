import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Dimensions, Platform, Animated, TouchableWithoutFeedback, ScrollView, Linking, Share, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/supabase';

const { width, height } = Dimensions.get('window');

const FloatingText = ({ tap, onComplete }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -250,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.2,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      })
    ]).start(() => onComplete(tap.id));
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingText,
        {
          left: tap.x - 30,
          top: tap.y - 30,
          opacity: opacity,
          transform: [{ translateY }, { scale }]
        }
      ]}
    >
      {tap.value}
    </Animated.Text>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [referrerCode, setReferrerCode] = useState('');
  const [invitedFriends, setInvitedFriends] = useState([]);
  const [hasUsedCode, setHasUsedCode] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);

  const [balance, setBalance] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [energy, setEnergy] = useState(2000);
  const [activeTab, setActiveTab] = useState('exchange');
  const [maxEnergy, setMaxEnergy] = useState(2000);
  const [tapIncrement, setTapIncrement] = useState(0);
  const [profitPerHour, setProfitPerHour] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession) {
          setSession(activeSession);
        } else {
          const fallback = await AsyncStorage.getItem('localFallbackSession');
          if (fallback) {
            setSession({ user: { email: fallback } });
          }
        }
      } catch (e) {}
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        setSession(newSession);
      } else {
        const fallback = await AsyncStorage.getItem('localFallbackSession');
        if (!fallback) setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Xatolik', 'Iltimos barcha maydonlarni to\'ldiring!');
      return;
    }
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert(
          'Tizimga kirish',
          'Supabase ulanishi muvaffaqiyatsiz tugadi (yoki login/parol xato). Mahalliy offline rejimda kirishni xohlaysizmi?',
          [
            { text: 'Yo\'q', style: 'cancel' },
            { 
              text: 'Ha (Offline)', 
              onPress: async () => {
                await AsyncStorage.setItem('localFallbackSession', email.trim());
                setSession({ user: { email: email.trim() } });
              } 
            }
          ]
        );
      } else {
        setSession(data.session);
      }
    } catch (e) {
      Alert.alert('Xatolik', 'Kutilmagan xato yuz berdi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Xatolik', 'Iltimos barcha maydonlarni to\'ldiring!');
      return;
    }
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert(
          'Ro\'yxatdan o\'tish',
          'Supabase ulanishi muvaffaqiyatsiz tugadi. Mahalliy offline rejimda hisob yaratishni xohlaysizmi?',
          [
            { text: 'Yo\'q', style: 'cancel' },
            { 
              text: 'Ha (Offline)', 
              onPress: async () => {
                await AsyncStorage.setItem('localFallbackSession', email.trim());
                setSession({ user: { email: email.trim() } });
              } 
            }
          ]
        );
      } else {
        Alert.alert('Muvaffaqiyatli', 'Ro\'yxatdan o\'tish yakunlandi! Tizimga kirdingiz.');
        setSession(data.session);
      }
    } catch (e) {
      Alert.alert('Xatolik', 'Kutilmagan xato yuz berdi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    await AsyncStorage.removeItem('localFallbackSession');
    setSession(null);
  };
  
  const initialUpgrades = [
    { id: '1', title: 'Fan tokens', category: 'Markets', baseProfit: 150, baseCost: 100, level: 0, icon: 'ticket-outline', effectType: 'profit' },
    { id: '2', title: 'Margin trading x10', category: 'Markets', baseProfit: 300, baseCost: 500, level: 0, icon: 'bar-chart-outline', effectType: 'profit' },
    { id: '3', title: 'KYC', category: 'Legal', baseProfit: 200, baseCost: 250, level: 0, icon: 'shield-checkmark-outline', effectType: 'profit' },
    { id: '4', title: 'Marketing', category: 'PR&Team', baseProfit: 400, baseCost: 1000, level: 0, icon: 'megaphone-outline', effectType: 'profit' },
    { id: '5', title: 'Energy Boost', category: 'Specials', baseProfit: 0, baseCost: 2000, level: 0, icon: 'battery-charging-outline', effectType: 'energy' },
    { id: '6', title: 'Tap Boost', category: 'Specials', baseProfit: 0, baseCost: 1500, level: 0, icon: 'hand-pointer-outline', effectType: 'tap' },
  ];
  const [upgrades, setUpgrades] = useState(initialUpgrades);
  const [mineCategory, setMineCategory] = useState('Markets');
  
  const profitAccumulator = useRef(0);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [taps, setTaps] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Load data when the app starts or session changes
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Always load local data first as a fast fallback
        const savedBalance = await AsyncStorage.getItem('notcoin_balance');
        const savedTaps = await AsyncStorage.getItem('notcoin_taps');
        const savedEnergy = await AsyncStorage.getItem('notcoin_energy');
        const savedProfit = await AsyncStorage.getItem('notcoin_profit');
        const savedUpgrades = await AsyncStorage.getItem('notcoin_upgrades');
        const savedTasks = await AsyncStorage.getItem('notcoin_tasks');
        
        if (savedBalance !== null) setBalance(parseInt(savedBalance, 10));
        if (savedTaps !== null) setTotalTaps(parseInt(savedTaps, 10));
        if (savedEnergy !== null) setEnergy(parseInt(savedEnergy, 10));
        if (savedProfit !== null) setProfitPerHour(parseInt(savedProfit, 10));
        if (savedUpgrades !== null) {
          const parsed = JSON.parse(savedUpgrades);
          const updated = parsed.map(u => {
            const init = initialUpgrades.find(i => i.id === u.id);
            return init ? { ...u, baseCost: init.baseCost } : u;
          });
          setUpgrades(updated);
        }
        if (savedTasks !== null) setCompletedTasks(JSON.parse(savedTasks));

        // 2. If logged in with a real Supabase account, sync values from Cloud
        if (session && session.user && !session.user.fallback) {
          // Load Profile (balance & energy)
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            if (profile.balance !== null) setBalance(Number(profile.balance));
            if (profile.energy !== null) setEnergy(Number(profile.energy));
          }

          // Load Inventory (mine upgrades count)
          const { data: inventory } = await supabase
            .from('inventory')
            .select('*')
            .eq('user_id', session.user.id);

          if (inventory && inventory.length > 0) {
            const updatedUpgrades = initialUpgrades.map(u => {
              const count = inventory.filter(item => item.item_id === u.id).length;
              return { ...u, level: count };
            });
            setUpgrades(updatedUpgrades);
            
            // Recalculate derived states from level counts
            let profit = 0;
            let energyMax = 2000;
            let tapInc = 0;
            
            updatedUpgrades.forEach(u => {
              if (u.level > 0) {
                if (u.effectType === 'profit') {
                  let itemProfit = 0;
                  for (let i = 0; i < u.level; i++) {
                    itemProfit += i === 0 ? u.baseProfit : Math.floor(u.baseProfit * 1.2);
                  }
                  profit += itemProfit;
                } else if (u.effectType === 'energy') {
                  energyMax += u.level * 500;
                } else if (u.effectType === 'tap') {
                  for (let lvl = 0; lvl < u.level; lvl++) {
                    let add = 0;
                    if (lvl === 0) add = 1;
                    else if (lvl === 1) add = 2;
                    else if (lvl === 2) add = 4;
                    else if (lvl === 3) add = 6;
                    else add = 2;
                    tapInc += add;
                  }
                }
              }
            });
            setProfitPerHour(profit);
            setMaxEnergy(energyMax);
            setTapIncrement(tapInc);
          }

          // Load Completed Tasks from Supabase
          const { data: dbTasks } = await supabase
            .from('user_tasks')
            .select('task_id')
            .eq('user_id', session.user.id);
          
          if (dbTasks) {
            setCompletedTasks(dbTasks.map(t => t.task_id));
          }
        }
      } catch (e) {
        console.log('Error loading data', e);
      }
    };
    loadData();
  }, [session]);

  // Sync balance and energy periodically to Supabase profiles
  useEffect(() => {
    const syncTimer = setTimeout(async () => {
      if (session && session.user && !session.user.fallback) {
        try {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            balance: balance,
            energy: energy
          });
        } catch (e) {
          console.log('Supabase sync error', e);
        }
      }
    }, 3000);
    return () => clearTimeout(syncTimer);
  }, [balance, energy, session]);

  const fetchFriendsData = async () => {
    if (session && session.user && !session.user.fallback) {
      try {
        // Fetch invited friends
        const { data: refs } = await supabase
          .from('referrals')
          .select('referee_id, profiles(email)')
          .eq('referrer_id', session.user.id);
        
        if (refs) {
          setInvitedFriends(refs.map(r => r.profiles?.email || 'Noma\'lum do\'st'));
        }

        // Check if current user has used a code
        const { data: used } = await supabase
          .from('referrals')
          .select('*')
          .eq('referee_id', session.user.id)
          .single();
        
        if (used) {
          setHasUsedCode(true);
        }
      } catch (e) {
        console.log('Error fetching friends data', e);
      }
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, [session, activeTab]);

  const handleApplyReferrer = async () => {
    if (!referrerCode.trim()) {
      Alert.alert('Xatolik', 'Iltimos, taklif kodini kiriting!');
      return;
    }
    if (referrerCode.trim() === session.user.id) {
      Alert.alert('Xatolik', 'O\'z taklif kodingizni kirita olmaysiz!');
      return;
    }
    setSubmittingCode(true);
    try {
      // Check if referrer exists
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', referrerCode.trim())
        .single();

      if (!referrerProfile) {
        Alert.alert('Xatolik', 'Bunday taklif kodi topilmadi!');
        setSubmittingCode(false);
        return;
      }

      // Insert referral
      const { error } = await supabase
        .from('referrals')
        .insert([{
          referrer_id: referrerCode.trim(),
          referee_id: session.user.id
        }]);

      if (error) {
        Alert.alert('Xatolik', 'Taklif kodi allaqachon ishlatilgan!');
      } else {
        // Award referee (current user)
        setBalance(prev => prev + 100000);
        setHasUsedCode(true);
        
        // Award referrer in DB
        await supabase
          .from('profiles')
          .update({ balance: Number(referrerProfile.balance) + 100000 })
          .eq('id', referrerCode.trim());
        
        Alert.alert('Muvaffaqiyatli', 'Taklif kodi qabul qilindi! Siz 100,000 tangaga ega bo\'ldingiz!');
      }
    } catch (e) {
      Alert.alert('Xatolik', 'Ulanishda xato yuz berdi.');
    } finally {
      setSubmittingCode(false);
    }
  };

  // Save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('notcoin_balance', balance.toString());
        await AsyncStorage.setItem('notcoin_taps', totalTaps.toString());
        await AsyncStorage.setItem('notcoin_energy', energy.toString());
        await AsyncStorage.setItem('notcoin_profit', profitPerHour.toString());
        await AsyncStorage.setItem('notcoin_upgrades', JSON.stringify(upgrades));
        await AsyncStorage.setItem('notcoin_tasks', JSON.stringify(completedTasks));
      } catch (e) {
        console.log('Error saving data', e);
      }
    };
    saveData();
  }, [balance, totalTaps, energy, profitPerHour, upgrades]);

  // Profit generation interval
  useEffect(() => {
    if (profitPerHour <= 0) return;
    const interval = setInterval(() => {
      profitAccumulator.current += profitPerHour / 3600;
      if (profitAccumulator.current >= 1) {
        const intPart = Math.floor(profitAccumulator.current);
        profitAccumulator.current -= intPart;
        setBalance(prev => prev + intPart);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [profitPerHour]);

  // Energy regeneration using maxEnergy
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        if (prev < maxEnergy) {
          return Math.min(prev + 3, maxEnergy);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  const RANK_THRESHOLDS = [
    0,        // 0
    0,        // 1 Bronze 1
    2000,     // 2 Bronze 2
    5000,     // 3 Bronze 3
    10000,    // 4 Silver 1
    25000,    // 5 Silver 2
    50000,    // 6 Silver 3
    100000,   // 7 Gold 1
    250000,   // 8 Gold 2
    500000,   // 9 Gold 3
    1000000,  // 10 Platinum 1
    2500000,  // 11 Platinum 2
    5000000,  // 12 Platinum 3
    10000000, // 13 Diamond 1
    20000000, // 14 Diamond 2
    30000000, // 15 Diamond 3
    50000000, // 16 Crown 1
    70000000, // 17 Crown 2
    85000000, // 18 Crown 3
    100000000 // 19 Ace
  ];

  const getRequiredTaps = (lvl) => {
    if (lvl <= 1) return 0;
    let required = 0;
    let gap = 1000;
    for (let i = 2; i <= lvl; i++) {
      required += gap;
      gap *= 2;
    }
    return required;
  };

  const getLevelFromTaps = (taps) => {
    let lvl = 1;
    while (taps >= getRequiredTaps(lvl + 1)) {
      lvl++;
    }
    return lvl;
  };

  const level = getLevelFromTaps(totalTaps);
  const nextLevelTaps = getRequiredTaps(level + 1);
  const currentLevelTaps = getRequiredTaps(level);
  const progressPercent = ((totalTaps - currentLevelTaps) / (nextLevelTaps - currentLevelTaps)) * 100;

  const tapValue = Math.pow(2, level - 1);

  const getRankName = (lvl) => {
    const roman = (n) => {
      const map = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'};
      return map[n] || n;
    };
    if (lvl <= 3) return `Bronze ${roman(lvl)}`;
    if (lvl <= 6) return `Silver ${roman(lvl - 3)}`;
    if (lvl <= 9) return `Gold ${roman(lvl - 6)}`;
    if (lvl <= 12) return `Platinum ${roman(lvl - 9)}`;
    if (lvl <= 15) return `Diamond ${roman(lvl - 12)}`;
    if (lvl <= 18) return `Crown ${roman(lvl - 15)}`;
    if (lvl === 19) return `Ace`;
    return `Level ${lvl - 19}`;
  };

  const getRankIcon = (lvl) => {
    if (lvl <= 3) return { name: 'medal', color: '#CD7F32' };
    if (lvl <= 6) return { name: 'medal', color: '#C0C0C0' };
    if (lvl <= 9) return { name: 'medal', color: '#FFD700' };
    if (lvl <= 12) return { name: 'diamond', color: '#E5E4E2' };
    if (lvl <= 15) return { name: 'diamond', color: '#B9F2FF' };
    if (lvl <= 18) return { name: 'star', color: '#FFB86C' };
    if (lvl === 19) return { name: 'trophy', color: '#FF4500' };
    return { name: 'star-outline', color: '#FFF' };
  };

  const handleTap = (e) => {
    const currentTapValue = tapValue + tapIncrement;
    if (energy < currentTapValue) return;

    setEnergy(prev => prev - currentTapValue);
    setTotalTaps(prev => prev + currentTapValue);
    
    // Add floating text
    const newTap = {
      id: Date.now().toString() + Math.random().toString(),
      x: e.nativeEvent.locationX,
      y: e.nativeEvent.locationY,
      value: `+${currentTapValue}`,
    };
    setTaps(prev => [...prev, newTap]);

    // Increase balance
    setBalance(prev => prev + currentTapValue);

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.92,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCheat = () => {
    // Secret button to test 1 million jumps
    setBalance(prev => prev + 1000000);
  };

  const handleBuyUpgrade = async (item) => {
    const currentCost = item.level === 0 ? item.baseCost : Math.floor(item.baseCost * Math.pow(1.5, item.level));
    if (balance >= currentCost) {
      setBalance(prev => prev - currentCost);

      if (item.effectType === 'profit') {
        const profitIncrease = item.level === 0 ? item.baseProfit : Math.floor(item.baseProfit * 1.2);
        setProfitPerHour(prev => prev + profitIncrease);
      } else if (item.effectType === 'energy') {
        // Increase maxEnergy by 500 per level
        setMaxEnergy(prev => prev + 500);
      } else if (item.effectType === 'tap') {
        // Determine increment based on current level
        const lvl = item.level;
        let add = 0;
        if (lvl === 0) add = 1;
        else if (lvl === 1) add = 2;
        else if (lvl === 2) add = 4;
        else if (lvl === 3) add = 6;
        else add = 2;
        setTapIncrement(prev => prev + add);
      }

      // Increase upgrade level
      setUpgrades(prev => prev.map(u => u.id === item.id ? { ...u, level: u.level + 1 } : u));

      // Save purchase to Supabase inventory table
      if (session && session.user && !session.user.fallback) {
        try {
          await supabase.from('inventory').insert([{
            user_id: session.user.id,
            item_id: item.id,
            name: item.title,
            cost: currentCost,
            icon: item.icon
          }]);
        } catch (e) {
          console.log('Error saving purchase to Supabase', e);
        }
      }
    }
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (!session) {
    return (
      <LinearGradient colors={['#182F58', '#0D162B', '#070C18']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <ScrollView contentContainerStyle={styles.authScrollContainer}>
            <View style={styles.authCard}>
              <Image source={require('./assets/hedgehog.png')} style={styles.authLogo} />
              <Text style={styles.authTitle}>
                {authMode === 'login' ? 'Tizimga Kirish' : "Ro'yxatdan O'tish"}
              </Text>
              <Text style={styles.authSubtitle}>
                {authMode === 'login' ? 'Kirpi bilan o\'yinda ishtirok eting' : 'Yangi hisob yaratib tangalar to\'plang'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput 
                  style={styles.authInput}
                  placeholder="example@mail.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Parol</Text>
                <TextInput 
                  style={styles.authInput}
                  placeholder="********"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity 
                style={styles.authButton} 
                onPress={authMode === 'login' ? handleLogin : handleRegister}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {authMode === 'login' ? 'Kirish' : "Ro'yxatdan O'tish"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchModeButton}
                onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                <Text style={styles.switchModeText}>
                  {authMode === 'login' 
                    ? "Akkauntingiz yo'qmi? Ro'yxatdan o'tish" 
                    : "Akkauntingiz bormi? Kirish"
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <TouchableOpacity style={styles.titleContainer} onPress={handleCheat}>
            <Text style={styles.title}>The Hedgehog</Text>
            <View style={styles.titleUnderline} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Earn per tap</Text>
            <View style={styles.statValueRow}>
              <Image source={require('./assets/coin.png')} style={styles.tinyCoin} />
              <Text style={styles.statValue}>+{formatNumber(tapValue + tapIncrement)}</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Next Level</Text>
            <Text style={styles.statValueText}>{formatNumber(totalTaps)} / {formatNumber(nextLevelTaps)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, {color: '#4ADE80'}]}>Profit per Hour</Text>
            <View style={styles.statValueRow}>
              <Image source={require('./assets/coin.png')} style={styles.tinyCoin} />
              <Text style={styles.statValue}>+{formatNumber(profitPerHour)}</Text>
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

        {activeTab === 'exchange' ? (
          <>
            {/* Level & Progress */}
            <View style={styles.levelContainer}>
              <TouchableOpacity style={styles.levelHeader} onPress={() => setActiveTab('ranks')}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons name={getRankIcon(level).name} size={16} color={getRankIcon(level).color} style={{marginRight: 6}} />
                  <Text style={styles.levelName}>{getRankName(level)} {'>'}</Text>
                </View>
                <Text style={styles.levelCount}>{formatNumber(totalTaps)} / {formatNumber(nextLevelTaps)}</Text>
              </TouchableOpacity>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={['#FF6B6B', '#FFB86C']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                />
              </View>
            </View>

            {/* Character Area */}
            <View style={styles.characterContainer}>
              <View style={styles.glowCircle} />
              <View style={styles.innerCircle}>
                <TouchableWithoutFeedback onPress={handleTap}>
                  <Animated.View style={[styles.characterImageWrapper, { transform: [{ scale: scaleValue }] }]}>
                    <Image 
                      source={require('./assets/hedgehog.png')} 
                      style={styles.characterImage} 
                      resizeMode="cover"
                    />
                    {taps.map(tap => (
                      <FloatingText 
                        key={tap.id} 
                        tap={tap} 
                        onComplete={(id) => {
                          setTaps(prev => prev.filter(t => t.id !== id));
                        }} 
                      />
                    ))}
                  </Animated.View>
                </TouchableWithoutFeedback>
              </View>
            </View>

            {/* Energy Container (Bottom) */}
            <View style={styles.energyContainer}>
              <Ionicons name="flash" size={24} color="#F59E0B" style={{marginRight: 8}} />
              <Text style={styles.energyText}>{energy} / {maxEnergy}</Text>
            </View>
          </>
        ) : activeTab === 'mine' ? (
          <View style={styles.mineContainer}>
            {/* Categories */}
            <View style={styles.mineTabs}>
              {['Markets', 'PR&Team', 'Legal', 'Specials'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.mineTab, mineCategory === cat && styles.mineTabActive]}
                  onPress={() => setMineCategory(cat)}
                >
                  <Text style={[styles.mineTabText, mineCategory === cat && styles.mineTabTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Cards */}
            <ScrollView style={styles.cardsScroll} contentContainerStyle={styles.cardsGrid}>
              {upgrades.filter(u => u.category === mineCategory || mineCategory === 'Specials').map(item => {
                const currentCost = item.level === 0 ? item.baseCost : Math.floor(item.baseCost * Math.pow(1.5, item.level));
                const profitIncrease = item.level === 0 ? item.baseProfit : Math.floor(item.baseProfit * 1.2);
                const canAfford = balance >= currentCost;
                
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.upgradeCard, !canAfford && {opacity: 0.7}]} 
                    onPress={() => handleBuyUpgrade(item)}
                  >
                    <View style={styles.upgradeHeader}>
                      <Ionicons name={item.icon} size={30} color="#FFB86C" />
                      <View style={styles.upgradeTitleBox}>
                        <Text style={styles.upgradeTitle}>{item.title}</Text>
                        <Text style={styles.upgradeProfitLabel}>Profit per hour</Text>
                        <Text style={styles.upgradeProfitValue}>+{formatNumber(profitIncrease)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.upgradeFooter}>
                      <Text style={styles.upgradeLevel}>lvl {item.level}</Text>
                      <View style={styles.upgradeCostBox}>
                        <Image source={require('./assets/coin.png')} style={styles.tinyCoin} />
                        <Text style={[styles.upgradeCost, !canAfford && {color: '#EF4444'}]}>
                          {formatNumber(currentCost)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : activeTab === 'ranks' ? (
          <View style={styles.ranksContainer}>
            <View style={styles.ranksHeader}>
              <TouchableOpacity onPress={() => setActiveTab('exchange')} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.ranksTitle}>All Ranks</Text>
            </View>
            <ScrollView style={styles.ranksScroll}>
              {[...Array(30)].map((_, i) => {
                const lvl = i + 1;
                const rankName = getRankName(lvl);
                const reqTaps = getRequiredTaps(lvl);
                const isCurrent = level === lvl;
                const icon = getRankIcon(lvl);
                
                return (
                  <View key={lvl} style={[styles.rankItem, isCurrent && styles.rankItemActive]}>
                    <View style={styles.rankInfo}>
                      <Ionicons name={icon.name} size={20} color={icon.color} style={{marginRight: 10}} />
                      <Text style={[styles.rankName, isCurrent && {color: '#FFB86C'}]}>{rankName}</Text>
                      {isCurrent && <Text style={styles.rankCurrentBadge}>Current</Text>}
                    </View>
                    <Text style={styles.rankTaps}>{formatNumber(reqTaps)} Taps</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : activeTab === 'friends' ? (
          <View style={styles.friendsContainer}>
            <View style={styles.friendsHeaderCard}>
              <FontAwesome5 name="user-friends" size={40} color="#FFB86C" style={styles.friendsHeaderIcon} />
              <Text style={styles.friendsTitle}>Do'stlarni Taklif Qiling</Text>
              <Text style={styles.friendsDesc}>Ikki do'st uchun ham 100,000 tangadan bonus oling!</Text>
            </View>

            <View style={styles.referralSection}>
              <View style={styles.cardRow}>
                <View style={[styles.codeCard, { marginRight: 10 }]}>
                  <Text style={styles.cardLabel}>Sizning Taklif Kodinigiz</Text>
                  <View style={styles.codeRowInline}>
                    <Text style={styles.codeTextInline} numberOfLines={1} ellipsizeMode="middle">
                      {session?.user?.id || ''}
                    </Text>
                    <TouchableOpacity 
                      style={styles.inlineCopyButton}
                      onPress={async () => {
                        try {
                          await Share.share({
                            message: `Salom! Hedgehog o'yiniga qo'shiling va 100,000 tanga bonus oling. Mening taklif kodim: ${session?.user?.id}`,
                          });
                        } catch (e) {}
                      }}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.codeCard}>
                  <Text style={styles.cardLabel}>Kodni Faollashtirish</Text>
                  {hasUsedCode ? (
                    <View style={styles.codeUsedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4ADE80" style={{marginRight: 4}} />
                      <Text style={styles.codeUsedTextInline}>Faol</Text>
                    </View>
                  ) : (
                    <View style={styles.inlineInputRow}>
                      <TextInput 
                        style={styles.inlineInput}
                        placeholder="Kod"
                        placeholderTextColor="#64748B"
                        value={referrerCode}
                        onChangeText={setReferrerCode}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity 
                        style={styles.inlineApplyButton} 
                        onPress={handleApplyReferrer}
                        disabled={submittingCode}
                      >
                        {submittingCode ? (
                          <ActivityIndicator color="#000" size="small" />
                        ) : (
                          <Ionicons name="arrow-forward" size={16} color="#000" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.friendsSubTitle}>Siz Taklif Qilgan Do'stlar ({invitedFriends.length})</Text>
            
            <ScrollView style={styles.friendsListScroll} showsVerticalScrollIndicator={false}>
              {invitedFriends.length === 0 ? (
                <View style={styles.noFriendsContainer}>
                  <Ionicons name="people-outline" size={48} color="#475569" />
                  <Text style={styles.noFriendsText}>Hozircha hech kim taklif qilinmagan.</Text>
                </View>
              ) : (
                invitedFriends.map((email, idx) => (
                  <View key={idx} style={styles.friendRow}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>{email[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.friendInfoCol}>
                      <Text style={styles.friendEmail} numberOfLines={1}>{email}</Text>
                      <Text style={styles.friendJoinedText}>Muvaffaqiyatli ulandi</Text>
                    </View>
                    <View style={styles.friendRewardBadge}>
                      <Text style={styles.friendRewardText}>+100K</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        ) : activeTab === 'earn' ? (
          <View style={styles.earnContainer}>
            <Text style={styles.earnTitle}>Earn More Coins</Text>
            <ScrollView style={styles.taskList}>
              {[
                { id: 'yt', title: 'Subscribe to YouTube', reward: 50000, url: 'https://youtube.com', icon: 'youtube', color: '#FF0000' },
                { id: 'tg', title: 'Join Telegram Channel', reward: 50000, url: 'https://telegram.org', icon: 'telegram', color: '#0088cc' },
                { id: 'ig', title: 'Follow on Instagram', reward: 50000, url: 'https://instagram.com', icon: 'instagram', color: '#E1306C' },
                { id: 'tw', title: 'Follow on Twitch', reward: 50000, url: 'https://twitch.tv', icon: 'twitch', color: '#6441a5' },
              ].map(task => {
                const isCompleted = completedTasks.includes(task.id);
                return (
                  <TouchableOpacity 
                    key={task.id}
                    style={[styles.taskCard, isCompleted && {opacity: 0.8}]}
                    onPress={async () => {
                      if (isCompleted) {
                        setBalance(prev => prev - task.reward);
                        setCompletedTasks(prev => prev.filter(id => id !== task.id));
                        if (session && session.user && !session.user.fallback) {
                          try {
                            await supabase
                              .from('user_tasks')
                              .delete()
                              .match({ user_id: session.user.id, task_id: task.id });
                          } catch (e) {
                            console.log('Error deleting task from Supabase', e);
                          }
                        }
                      } else {
                        Linking.openURL(task.url);
                        setBalance(prev => prev + task.reward);
                        setCompletedTasks(prev => [...prev, task.id]);
                        if (session && session.user && !session.user.fallback) {
                          try {
                            await supabase.from('user_tasks').insert([{
                              user_id: session.user.id,
                              task_id: task.id
                            }]);
                          } catch (e) {
                            console.log('Error saving task to Supabase', e);
                          }
                        }
                      }
                    }}
                  >
                    <FontAwesome5 name={task.icon} size={30} color={task.color} style={styles.taskIcon} />
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskReward}>+{formatNumber(task.reward)} coins</Text>
                    </View>
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />
                    ) : (
                      <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={activeTab === 'exchange' ? styles.navItemActive : styles.navItem} onPress={() => setActiveTab('exchange')}>
            <Ionicons name="swap-horizontal" size={24} color={activeTab === 'exchange' ? '#FFF' : '#94A3B8'} />
            <Text style={activeTab === 'exchange' ? styles.navTextActive : styles.navText}>Exchange</Text>
          </TouchableOpacity>
          <TouchableOpacity style={activeTab === 'mine' ? styles.navItemActive : styles.navItem} onPress={() => setActiveTab('mine')}>
            <MaterialCommunityIcons name="pickaxe" size={24} color={activeTab === 'mine' ? '#FFF' : '#94A3B8'} />
            <Text style={activeTab === 'mine' ? styles.navTextActive : styles.navText}>Mine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={activeTab === 'friends' ? styles.navItemActive : styles.navItem} onPress={() => setActiveTab('friends')}>
            <FontAwesome5 name="user-friends" size={20} color={activeTab === 'friends' ? '#FFF' : '#94A3B8'} />
            <Text style={activeTab === 'friends' ? styles.navTextActive : styles.navText}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={activeTab === 'earn' ? styles.navItemActive : styles.navItem} onPress={() => setActiveTab('earn')}>
            <FontAwesome5 name="coins" size={20} color={activeTab === 'earn' ? '#FFF' : '#94A3B8'} />
            <Text style={activeTab === 'earn' ? styles.navTextActive : styles.navText}>Earn</Text>
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    borderRadius: 8,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statValueText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
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
    borderRadius: 20,
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
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.425,
  },
  characterImage: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.425,
  },
  accessory: {
    position: 'absolute',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
  floatingText: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 40,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 100,
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  energyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mineContainer: {
    flex: 1,
    marginTop: 10,
  },
  mineTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  mineTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mineTabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  mineTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mineTabTextActive: {
    color: '#FFF',
  },
  cardsScroll: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  upgradeCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradeTitleBox: {
    marginLeft: 10,
    flex: 1,
  },
  upgradeTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  upgradeProfitLabel: {
    color: '#94A3B8',
    fontSize: 9,
  },
  upgradeProfitValue: {
    color: '#FFB86C',
    fontSize: 10,
    fontWeight: 'bold',
  },
  upgradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  upgradeLevel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeCostBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeCost: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ranksContainer: {
    flex: 1,
    marginTop: 10,
  },
  ranksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 5,
  },
  ranksTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  ranksScroll: {
    flex: 1,
    paddingHorizontal: 15,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  rankItemActive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    marginBottom: 5,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankCurrentBadge: {
    backgroundColor: '#FFB86C',
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  rankTaps: {
    color: '#94A3B8',
    fontSize: 14,
  },
  simpleTabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  simpleTabIcon: {
    marginBottom: 20,
  },
  simpleTabTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  simpleTabDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  simpleTabButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  simpleTabButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  earnContainer: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  earnTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  taskList: {
    flex: 1,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  taskIcon: {
    width: 40,
    textAlign: 'center',
  },
  taskInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  taskTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskReward: {
    color: '#FFB86C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  authLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  authTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  authInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 16,
  },
  authButton: {
    width: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  authButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    marginTop: 20,
  },
  switchModeText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  friendsHeaderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  friendsHeaderIcon: {
    marginBottom: 10,
  },
  friendsTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  friendsDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  referralSection: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  codeTextInline: {
    color: '#FFB86C',
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 6,
  },
  inlineCopyButton: {
    backgroundColor: '#FFB86C',
    borderRadius: 6,
    padding: 4,
  },
  codeUsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'center',
  },
  codeUsedTextInline: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 4,
  },
  inlineInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlineApplyButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 8,
    padding: 6,
  },
  friendsSubTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  friendsListScroll: {
    flex: 1,
  },
  noFriendsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noFriendsText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB86C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  friendInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  friendEmail: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendJoinedText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  friendRewardBadge: {
    backgroundColor: 'rgba(255, 184, 108, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  friendRewardText: {
    color: '#FFB86C',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

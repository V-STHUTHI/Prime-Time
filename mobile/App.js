import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// System Default Presets
const DEFAULT_PRESETS = [
  {
    id: 'default-routine',
    name: 'Routine Day (On Time)',
    sleepHours: 8.0,
    wakeTime: '07:00',
    peakTime: '10:00',
    dipTime: '14:30',
    midTime: '18:00',
    isSystem: true
  },
  {
    id: 'default-late-home',
    name: 'Late Back Home (Short Sleep)',
    sleepHours: 5.5,
    wakeTime: '06:30',
    peakTime: '11:00',
    dipTime: '14:00',
    midTime: '19:00',
    isSystem: true
  },
  {
    id: 'default-night-owl',
    name: 'Night Owl Shift',
    sleepHours: 8.0,
    wakeTime: '09:30',
    peakTime: '14:00',
    dipTime: '17:30',
    midTime: '21:00',
    isSystem: true
  }
];

// Hour category information (metadata for descriptions and styling)
const CATEGORY_META = {
  sleep: {
    label: 'Deep Sleep',
    colorHex: '#1e1b4b',
    bgHex: '#e0e7ff',
    textHex: '#312e81',
    desc: 'Deep sleep & physical recovery. Essential for brain waste clearance.',
    advice: 'Ensure room is cool, dark, and quiet. Do not check screens.'
  },
  transition: {
    label: 'Wake Transition',
    colorHex: '#6366f1',
    bgHex: '#e0e7ff',
    textHex: '#4f46e5',
    desc: 'Cortisol rising, waking up. Brain is clearing out adenosine.',
    advice: 'Get 10 mins of light. Delay coffee for 90 mins to avoid crashes.'
  },
  peak: {
    label: 'Peak Focus (Deep Work)',
    colorHex: '#f59e0b',
    bgHex: '#fef3c7',
    textHex: '#b45309',
    desc: 'Maximum cognitive efficiency, focus, and analytical capability.',
    advice: 'Work on hard cognitive tasks (writing, coding, deep strategy).'
  },
  dip: {
    label: 'Trough Zone',
    colorHex: '#3b82f6',
    bgHex: '#dbeafe',
    textHex: '#1d4ed8',
    desc: 'Circadian dip. Lower vigilance, higher sleepiness, and slower responses.',
    advice: 'Do admin work, emails, or take a 20-min power nap.'
  },
  middle: {
    label: 'Secondary Peak',
    colorHex: '#10b981',
    bgHex: '#d1fae5',
    textHex: '#047857',
    desc: 'Moderate-high efficiency. Excellent for collaboration & learning.',
    advice: 'Great for reviews, meetings, lighter design, or skill updates.'
  },
  winddown: {
    label: 'Wind Down',
    colorHex: '#8b5cf6',
    bgHex: '#f3e8ff',
    textHex: '#6d28d9',
    desc: 'Preparing body for sleep. Melatonin release starting.',
    advice: 'Dim overhead lights. Turn off work screens. Stretch or read.'
  },
  open: {
    label: 'Routine / Open Time',
    colorHex: '#64748b',
    bgHex: '#f1f5f9',
    textHex: '#475569',
    desc: 'Standard daily baseline. Decent energy for physical tasks.',
    advice: 'Good for workouts, chores, commutes, running errands, or calls.'
  }
};

const LOADING_MESSAGES = [
  "Caffeinating synapses...",
  "Siphoning sleep debt...",
  "Consulting the Circadian Council...",
  "Calibrating melatonin inhibitors...",
  "Spinning up the pineal gland...",
  "Bribing neurons with coffee...",
  "Measuring cognitive coefficient...",
  "Aligning sun and moon orbits...",
  "Calculating willpower reserves..."
];

export default function App() {
  // Application State
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioId, setCurrentScenarioId] = useState('default-routine');
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState(LOADING_MESSAGES[0]);
  const [selectedHour, setSelectedHour] = useState(null);

  // Form Inputs
  const [inputName, setInputName] = useState('');
  const [inputSleep, setInputSleep] = useState('8.0');
  const [inputWake, setInputWake] = useState('07:00');
  const [inputPeak, setInputPeak] = useState('10:00');
  const [inputDip, setInputDip] = useState('14:30');
  const [inputMid, setInputMid] = useState('18:00');

  // Animation values
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const coffeeAnim = useRef(new Animated.Value(0)).current;
  const brainAnim = useRef(new Animated.Value(1)).current;

  // --- Initialize app ---
  useEffect(() => {
    loadScenarios();
  }, []);

  // Set up animations
  useEffect(() => {
    // Loop orbital rotation
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Loop coffee bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(coffeeAnim, {
          toValue: -6,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(coffeeAnim, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ).start();

    // Loop brain pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(brainAnim, {
          toValue: 1.12,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(brainAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // --- LocalStorage/AsyncStorage Sync ---
  const loadScenarios = async () => {
    try {
      const raw = await AsyncStorage.getItem('chrono_scenarios');
      if (raw) {
        const parsed = JSON.parse(raw);
        setScenarios(parsed);
        selectScenario('default-routine', parsed);
      } else {
        await AsyncStorage.setItem('chrono_scenarios', JSON.stringify(DEFAULT_PRESETS));
        setScenarios(DEFAULT_PRESETS);
        selectScenario('default-routine', DEFAULT_PRESETS);
      }
    } catch (e) {
      console.log("Error loading scenarios", e);
    }
  };

  const saveScenarios = async (newScenarios) => {
    try {
      setScenarios(newScenarios);
      await AsyncStorage.setItem('chrono_scenarios', JSON.stringify(newScenarios));
    } catch (e) {
      console.log("Error saving scenarios", e);
    }
  };

  const selectScenario = (id, list = scenarios) => {
    const scenario = list.find(s => s.id === id) || list[0];
    if (!scenario) return;

    setCurrentScenarioId(id);
    setInputName(scenario.name);
    setInputSleep(scenario.sleepHours.toString());
    setInputWake(scenario.wakeTime);
    setInputPeak(scenario.peakTime);
    setInputDip(scenario.dipTime);
    setInputMid(scenario.midTime);

    // Run dynamic calculations
    const data = calculateCircadianSchedule(scenario);
    setHourlyData(data);
    setSelectedHour(null);
  };

  // --- Time Parsers ---
  const parseTimeToFloat = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
  };

  const formatFloatToTime = (val) => {
    let h = Math.floor(val) % 24;
    let m = Math.round((val % 1) * 60);
    if (m === 60) {
      m = 0;
      h = (h + 1) % 24;
    }
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const isHourInRange = (h, start, end) => {
    if (start <= end) {
      return h >= start && h < end;
    } else {
      return h >= start || h < end;
    }
  };

  // --- Circular SVG Arc Draw Math ---
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeDonutSegment = (cx, cy, innerRadius, outerRadius, startAngle, endAngle) => {
    const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
    const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
    const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
    const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
      "L", endInner.x, endInner.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 0, startInner.x, startInner.y,
      "Z"
    ].join(" ");
  };

  // --- Dynamic Calculator Engine ---
  const calculateCircadianSchedule = (scenario) => {
    const sleepHours = parseFloat(scenario.sleepHours);
    const wakeVal = parseTimeToFloat(scenario.wakeTime);
    const peakVal = parseTimeToFloat(scenario.peakTime);
    const dipVal = parseTimeToFloat(scenario.dipTime);
    const midVal = parseTimeToFloat(scenario.midTime);
    const bedVal = (wakeVal - sleepHours + 24) % 24;
    const isSleepDeprived = sleepHours < 6.5;

    const list = [];
    for (let i = 0; i < 24; i++) {
      const currentHour = (Math.floor(wakeVal) + i) % 24;
      let category = 'open';
      let energyScore = 65;
      let warnings = [];

      const inSleep = isHourInRange(currentHour, bedVal, wakeVal);
      const inTransition = isHourInRange(currentHour, wakeVal, (wakeVal + 1.5) % 24);
      const inWinddown = isHourInRange(currentHour, (bedVal - 1.5 + 24) % 24, bedVal);
      const inPeak = isHourInRange(currentHour, (peakVal - 1.5 + 24) % 24, (peakVal + 1.5) % 24);
      const inDip = isHourInRange(currentHour, (dipVal - 1.5 + 24) % 24, (dipVal + 1.5) % 24);
      const inMiddle = isHourInRange(currentHour, (midVal - 1 + 24) % 24, (midVal + 1) % 24);

      if (inSleep) {
        category = 'sleep';
        energyScore = 10;
      } else if (inPeak) {
        category = 'peak';
        energyScore = isSleepDeprived ? 75 : 95;
      } else if (inDip) {
        category = 'dip';
        energyScore = isSleepDeprived ? 25 : 45;
      } else if (inMiddle) {
        category = 'middle';
        energyScore = isSleepDeprived ? 60 : 78;
      } else if (inWinddown) {
        category = 'winddown';
        energyScore = 35;
      } else if (inTransition) {
        category = 'transition';
        energyScore = 55;
      }

      let dynamicAdvice = CATEGORY_META[category].advice;
      let dynamicDesc = CATEGORY_META[category].desc;

      if (isSleepDeprived) {
        if (category === 'peak') {
          dynamicDesc = `Fragile Focus. Sleep is low (${sleepHours}h). Risk of mind-wandering.`;
          dynamicAdvice = "Avoid strategic decisions. Work in 20-min chunks (Pomodoro).";
          warnings.push("Focus crash risk");
        } else if (category === 'dip') {
          dynamicDesc = "Critical Fatigue Zone. Sleep debt magnifier active.";
          dynamicAdvice = "MANDATORY REST: Take a 15-min power nap. Avoid driving or high-stakes discussions.";
          warnings.push("High fatigue warning");
        }
      }

      list.push({
        hour: currentHour,
        timeString: `${currentHour.toString().padStart(2, '0')}:00`,
        category,
        energy: energyScore,
        description: dynamicDesc,
        advice: dynamicAdvice,
        warnings
      });
    }
    return list;
  };

  // --- Run Simulated Loader ---
  const triggerAnalysis = (activeScenario) => {
    setLoading(true);
    let msgIdx = 0;
    setLoaderText(LOADING_MESSAGES[0]);

    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoaderText(LOADING_MESSAGES[msgIdx]);
    }, 800);

    setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
      const calculated = calculateCircadianSchedule(activeScenario);
      setHourlyData(calculated);
      setSelectedHour(null);
    }, 2500);
  };

  // --- Form Handlers ---
  const handleSubmit = () => {
    const sleepHours = parseFloat(inputSleep);
    if (isNaN(sleepHours) || sleepHours < 3 || sleepHours > 14) {
      Alert.alert("Invalid Input", "Please input a sleep duration between 3 and 14 hours.");
      return;
    }

    const currentActive = scenarios.find(s => s.id === currentScenarioId) || scenarios[0];

    if (currentActive.isSystem) {
      // Create copy
      const newId = 'custom-' + Date.now();
      const newScenario = {
        id: newId,
        name: inputName === currentActive.name ? `${inputName} (Custom)` : inputName,
        sleepHours,
        wakeTime: inputWake,
        peakTime: inputPeak,
        dipTime: inputDip,
        midTime: inputMid,
        isSystem: false
      };
      const list = [...scenarios, newScenario];
      saveScenarios(list);
      setCurrentScenarioId(newId);
      triggerAnalysis(newScenario);
    } else {
      // Edit existing
      const updatedList = scenarios.map(s => {
        if (s.id === currentScenarioId) {
          return {
            ...s,
            name: inputName,
            sleepHours,
            wakeTime: inputWake,
            peakTime: inputPeak,
            dipTime: inputDip,
            midTime: inputMid
          };
        }
        return s;
      });
      saveScenarios(updatedList);
      const active = updatedList.find(s => s.id === currentScenarioId);
      triggerAnalysis(active);
    }
  };

  const handleCreateCopy = () => {
    const newId = 'custom-' + Date.now();
    const newScenario = {
      id: newId,
      name: `${inputName} (Copy)`,
      sleepHours: parseFloat(inputSleep) || 8.0,
      wakeTime: inputWake,
      peakTime: inputPeak,
      dipTime: inputDip,
      midTime: inputMid,
      isSystem: false
    };
    const list = [...scenarios, newScenario];
    saveScenarios(list);
    setCurrentScenarioId(newId);
    triggerAnalysis(newScenario);
  };

  const handleDeleteCustom = () => {
    if (currentScenarioId.startsWith('default-')) {
      Alert.alert("Locked Preset", "Cannot delete system preset profiles.");
      return;
    }
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this scenario?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const list = scenarios.filter(s => s.id !== currentScenarioId);
            saveScenarios(list);
            selectScenario('default-routine', list);
          }
        }
      ]
    );
  };

  // --- Calculations for UI ---
  const activeScenario = scenarios.find(s => s.id === currentScenarioId) || DEFAULT_PRESETS[0];
  const sleepHrs = activeScenario ? parseFloat(activeScenario.sleepHours) : 8.0;
  const isSleepDeprived = sleepHrs < 6.5;

  let circadianScore = 100;
  if (isSleepDeprived) {
    circadianScore -= (6.5 - sleepHrs) * 30;
  } else if (sleepHrs > 9.5) {
    circadianScore -= 15;
  }
  circadianScore = Math.max(10, Math.min(100, Math.round(circadianScore)));

  let scoreRating = "Optimal Recovery";
  let scoreColor = "#10b981";
  let scoreBg = "#ecfdf5";
  if (circadianScore < 60) {
    scoreRating = "Severe Sleep Debt";
    scoreColor = "#ef4444";
    scoreBg = "#fef2f2";
  } else if (circadianScore < 85) {
    scoreRating = "Moderate Recovery";
    scoreColor = "#f59e0b";
    scoreBg = "#fffbeb";
  }

  // Interpolated rotation values for orbital loader
  const orbitRotation = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER BANNER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.headerIconContainer, { transform: [{ scale: brainAnim }] }]}>
            <Text style={styles.headerIcon}>⚡</Text>
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>ChronoSchedule</Text>
            <Text style={styles.headerSubtitle}>CIRCADIAN HEALTH ACCELERATOR</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* PROFILE/SCENARIO SELECTOR */}
        <Text style={styles.sectionLabel}>DAILY PROFILES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {scenarios.map(s => {
            const isActive = s.id === currentScenarioId;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => selectScenario(s.id)}
                style={[styles.presetCapsule, isActive && styles.presetCapsuleActive]}
              >
                <Text style={[styles.presetName, isActive && styles.presetNameActive]}>{s.name}</Text>
                <Text style={[styles.presetInfo, isActive && styles.presetInfoActive]}>
                  {s.sleepHours}h sleep • Wake {s.wakeTime}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* INPUT PANEL CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>CONFIGURATION</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Scenario Name</Text>
              <TextInput
                style={styles.textInput}
                value={inputName}
                onChangeText={setInputName}
                placeholder="e.g. Late back home"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sleep Hours</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={inputSleep}
                onChangeText={setInputSleep}
                placeholder="e.g. 8"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wake-up (HH:MM)</Text>
              <TextInput
                style={styles.textInput}
                value={inputWake}
                onChangeText={setInputWake}
                placeholder="07:00"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Peak Efficiency</Text>
              <TextInput
                style={[styles.textInput, styles.bgAmber]}
                value={inputPeak}
                onChangeText={setInputPeak}
                placeholder="10:00"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Least Efficient</Text>
              <TextInput
                style={[styles.textInput, styles.bgBlue]}
                value={inputDip}
                onChangeText={setInputDip}
                placeholder="14:30"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Middle Efficiency</Text>
              <TextInput
                style={[styles.textInput, styles.bgGreen]}
                value={inputMid}
                onChangeText={setInputMid}
                placeholder="18:00"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>ANALYZE & SAVE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleCreateCopy} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>SAVE COPY</Text>
            </TouchableOpacity>

            {!activeScenario.isSystem && (
              <TouchableOpacity onPress={handleDeleteCustom} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>DELETE</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 24 HOUR INTERACTIVE CIRCADIAN CLOCK */}
        <View style={[styles.card, styles.centerAlign]}>
          <Text style={styles.cardHeader}>INTERACTIVE 24H CIRCADIAN WHEEL</Text>
          <Text style={styles.helpText}>Tap sectors below to inspect your energy levels</Text>

          {/* SVG WHEEL */}
          <View style={styles.wheelWrapper}>
            <Svg width="290" height="290" viewBox="0 0 340 340">
              <G>
                {hourlyData.map((hourObj, idx) => {
                  const startAngle = hourObj.hour * 15 - 90;
                  const endAngle = (hourObj.hour + 1) * 15 - 90;
                  const meta = CATEGORY_META[hourObj.category];
                  const d = describeDonutSegment(170, 170, 95, 145, startAngle, endAngle);

                  return (
                    <Path
                      key={idx}
                      d={d}
                      fill={meta.colorHex}
                      opacity={selectedHour && selectedHour.hour === hourObj.hour ? 1.0 : 0.82}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      onPress={() => setSelectedHour(hourObj)}
                    />
                  );
                })}

                {/* Donut center white circle */}
                <Circle cx="170" cy="170" r="92" fill="#ffffff" />

                {/* SVG TEXT DISPLAYS */}
                <SvgText
                  x="170"
                  y="135"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {selectedHour ? `${selectedHour.timeString} - ${formatFloatToTime(selectedHour.hour + 1)}` : 'CIRCADIAN'}
                </SvgText>
                
                <SvgText
                  x="170"
                  y="170"
                  textAnchor="middle"
                  fill={selectedHour ? CATEGORY_META[selectedHour.category].colorHex : '#1e293b'}
                  fontSize="15"
                  fontWeight="900"
                >
                  {selectedHour ? CATEGORY_META[selectedHour.category].label : 'Tap any segment'}
                </SvgText>

                <SvgText
                  x="170"
                  y="200"
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {selectedHour ? `Energy: ${selectedHour.energy}%` : 'to view details'}
                </SvgText>
              </G>
            </Svg>
          </View>
        </View>

        {/* OVERALL SCORECARD & HEALTH */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>CIRCADIAN SCORECARD</Text>
          <View style={styles.insightsRow}>
            <View style={[styles.scoreCircle, { borderColor: scoreColor, backgroundColor: scoreBg }]}>
              <Text style={[styles.scoreVal, { color: scoreColor }]}>{circadianScore}</Text>
              <Text style={styles.scoreText}>Score</Text>
            </View>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreLabel}>Circadian Status</Text>
              <Text style={styles.scoreRating}>{scoreRating}</Text>
              <Text style={styles.scoreDesc}>
                {isSleepDeprived 
                  ? "Your body is carrying a sleep deficit. Focus blocks will experience sudden fatigue troughs."
                  : "Excellent recovery. Circadian rhythm and sleep foundation is synchronized for focus blocks."}
              </Text>
            </View>
          </View>
        </View>

        {/* HOUR-BY-HOUR TIMELINE */}
        <Text style={styles.sectionLabel}>HOURLY FLOW RECOMMENDATIONS</Text>
        <View style={styles.timelineContainer}>
          {hourlyData.map((hourObj, idx) => {
            const meta = CATEGORY_META[hourObj.category];
            const isWarn = hourObj.warnings.length > 0;

            return (
              <View key={idx} style={[styles.timelineItem, isWarn && styles.timelineItemWarn]}>
                <View style={styles.timelineTimeColumn}>
                  <Text style={styles.timelineTime}>{hourObj.timeString}</Text>
                  <Text style={styles.timelineTimeEnd}>to {formatFloatToTime(hourObj.hour + 1)}</Text>
                </View>

                <View style={styles.timelineBody}>
                  <View style={[styles.timelineBadge, { backgroundColor: meta.bgHex }]}>
                    <Text style={[styles.timelineBadgeText, { color: meta.textHex }]}>
                      {meta.label}
                    </Text>
                  </View>
                  <Text style={styles.timelineDesc}>{hourObj.description}</Text>
                  <Text style={styles.timelineAdvice}>{hourObj.advice}</Text>
                </View>

                <View style={styles.timelineEnergy}>
                  <Text style={[styles.energyVal, isWarn && styles.textRed]}>
                    {isWarn ? '⚠️ ' : ''}{hourObj.energy}%
                  </Text>
                  <View style={styles.energyTrack}>
                    <View 
                      style={[
                        styles.energyFill, 
                        { width: `${hourObj.energy}%`, backgroundColor: isWarn ? '#ef4444' : meta.colorHex }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FUN ANIMATED LOADING OVERLAY */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderOrbitContainer}>
            {/* Spinning Celestial Path */}
            <Animated.View style={[styles.loaderOrbit, { transform: [{ rotate: orbitRotation }] }]}>
              {/* Sun */}
              <View style={styles.loaderSun}>
                <Text style={styles.miniIcon}>☀️</Text>
              </View>
              {/* Moon */}
              <View style={styles.loaderMoon}>
                <Text style={styles.miniIcon}>🌙</Text>
              </View>
            </Animated.View>

            {/* Twinkles */}
            <Text style={[styles.twinkle, styles.t1]}>⭐</Text>
            <Text style={[styles.twinkle, styles.t2]}>⭐</Text>

            {/* Coffee Centered Bouncer */}
            <Animated.View style={[styles.loaderCoffee, { transform: [{ translateY: coffeeAnim }] }]}>
              {/* Steam waves */}
              <View style={styles.steamContainer}>
                <Text style={styles.steam}>░</Text>
              </View>
              {/* Coffee Cup */}
              <View style={styles.coffeeCup}>
                <Text style={styles.coffeeIcon}>☕</Text>
              </View>
            </Animated.View>
          </View>
          
          <Text style={styles.loaderTitle}>Synthesizing Circadian Day...</Text>
          <Text style={styles.loaderSubtitleText}>{loaderText}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3
  },
  headerIcon: {
    fontSize: 18,
    color: '#ffffff'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 10
  },
  presetsScroll: {
    flexGrow: 0,
    marginBottom: 16
  },
  presetCapsule: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
    minWidth: 150
  },
  presetCapsuleActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1'
  },
  presetName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b'
  },
  presetNameActive: {
    color: '#ffffff'
  },
  presetInfo: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3
  },
  presetInfoActive: {
    color: '#c7d2fe'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 1
  },
  centerAlign: {
    alignItems: 'center'
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 14
  },
  helpText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  inputGroup: {
    flex: 1
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1e293b'
  },
  bgAmber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d'
  },
  bgBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe'
  },
  bgGreen: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#6366f1',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  copyBtn: {
    flex: 1.2,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569'
  },
  deleteBtn: {
    flex: 0.9,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48'
  },
  wheelWrapper: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  insightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreVal: {
    fontSize: 20,
    fontWeight: '900'
  },
  scoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: -2,
    textTransform: 'uppercase'
  },
  scoreTextContainer: {
    flex: 1
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  scoreRating: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 2
  },
  scoreDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 15
  },
  timelineContainer: {
    gap: 12
  },
  timelineItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  timelineItemWarn: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5'
  },
  timelineTimeColumn: {
    width: 68,
    justifyContent: 'center'
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e293b'
  },
  timelineTimeEnd: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1
  },
  timelineBody: {
    flex: 1,
    paddingHorizontal: 8
  },
  timelineBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 5
  },
  timelineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  timelineDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 14
  },
  timelineAdvice: {
    fontSize: 10,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#6366f1',
    marginTop: 4
  },
  timelineEnergy: {
    width: 65,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  energyVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569'
  },
  textRed: {
    color: '#ef4444'
  },
  energyTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden'
  },
  energyFill: {
    height: '100%',
    borderRadius: 2
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  loaderOrbitContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  loaderOrbit: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loaderSun: {
    position: 'absolute',
    top: -15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3
  },
  loaderMoon: {
    position: 'absolute',
    bottom: -15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3
  },
  miniIcon: {
    fontSize: 16
  },
  twinkle: {
    position: 'absolute',
    fontSize: 10,
    color: '#818cf8',
    opacity: 0.6
  },
  t1: {
    top: 30,
    left: 30
  },
  t2: {
    bottom: 30,
    right: 30
  },
  loaderCoffee: {
    position: 'absolute',
    alignItems: 'center'
  },
  steamContainer: {
    marginBottom: -4,
    height: 16,
    justifyContent: 'flex-end'
  },
  steam: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 14
  },
  coffeeCup: {
    width: 44,
    height: 36,
    borderRadius: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 3,
    borderColor: '#6366f1',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  coffeeIcon: {
    fontSize: 16
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  loaderSubtitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
    marginTop: 6,
    fontStyle: 'italic'
  }
});

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import { BADGE_CONFIG } from '../services/streakService';
import { useLanguage } from '../contexts/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Animated UI that shows the current streak, badges, and mercy rule status.
 *
 * @param {number} streak - The current numerical streak count
 * @param {boolean} freezeUsed - True if the mercy freeze was used this month
 * @param {object[]} badges - Array of unlocked BADGE_CONFIG objects
 * @param {number|null} milestoneReached - If a new milestone was just reached
 */
export default function StreakBanner({ streak, freezeUsed, badges, milestoneReached }) {
  const { t } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // Trigger confetti if a new milestone was passed into props
  useEffect(() => {
    if (milestoneReached) {
      setShowConfetti(true);
      setConfettiKey(prev => prev + 1); // unmount/remount to trigger anew
    }
  }, [milestoneReached]);

  return (
    <View style={styles.container}>
      {showConfetti && (
        <ConfettiCannon
          key={`confetti-${confettiKey}`}
          count={100}
          origin={{ x: width / 2, y: -20 }}
          fallSpeed={3000}
          explosionSpeed={500}
          fadeOut={true}
          autoStart={true}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}

      {/* Main Streak Graphic */}
      <View style={styles.streakCard}>
        <LinearGradient
          colors={streak > 0 ? ['#F97316', '#EA580C'] : ['#334155', '#1E293B']}
          style={styles.flameCircle}
        >
          <Text style={styles.flameIcon}>🔥</Text>
        </LinearGradient>

        <View style={styles.streakTextCol}>
          {streak > 0 ? (
            <Text style={styles.streakCountText}>{t('dayStreak', streak)}</Text>
          ) : (
            <Text style={styles.startStreakText}>{t('startYourStreak')}</Text>
          )}

          {/* Mercy Rule UI */}
          {streak > 0 && (
            <View style={styles.freezeRow}>
              <MaterialCommunityIcons 
                name={freezeUsed ? 'shield-off-outline' : 'shield-check-outline'} 
                size={14} 
                color={freezeUsed ? '#64748B' : '#00C9A7'} 
              />
              <Text style={[styles.freezeText, freezeUsed && styles.freezeTextUsed]}>
                {freezeUsed ? t('freezeUsed') : t('freezeRemaining')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitle}>{t('badgesUnlocked')}</Text>
          <View style={styles.badgesRow}>
            {badges.map((badge, idx) => (
              <View key={idx} style={styles.badgeItem}>
                <View style={styles.badgeCircle}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeLabel} numberOfLines={1}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    zIndex: 10,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  flameCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  flameIcon: {
    fontSize: 28,
  },
  streakTextCol: {
    flex: 1,
  },
  streakCountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  startStreakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  freezeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  freezeText: {
    fontSize: 12,
    color: '#00C9A7',
    fontWeight: '600',
  },
  freezeTextUsed: {
    color: '#64748B',
    fontWeight: '400',
  },
  
  badgesSection: {
    backgroundColor: '#0F172A', // matching dashboard bg
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    width: (width - 48 - 36) / 4, // 4 items per row accounting for padding/gap
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 6,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
    textAlign: 'center',
  },
});

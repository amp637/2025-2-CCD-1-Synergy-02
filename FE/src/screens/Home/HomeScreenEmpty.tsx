import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import responsive from '../../utils/responsive';

interface HomeScreenEmptyProps {
  onPrescriptionRegister?: () => void;
  onPillEnvelopeRegister?: () => void;
  onEditInfo?: () => void;
}

export default function HomeScreenEmpty({ onPrescriptionRegister, onPillEnvelopeRegister, onEditInfo }: HomeScreenEmptyProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headingContainer}>
            <Text style={styles.dateText}>10월 10일 (금)</Text>
            <Text style={styles.greetingText}>오늘도 건강한 하루 되세요</Text>
          </View>
        </View>

        {/* Action Buttons Grid */}
        <View style={styles.actionButtonsContainer}>
          {/* Prescription Button */}
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.8}
            onPress={onPrescriptionRegister}
          >
            <LinearGradient
              colors={['#6b6558', '#5a5347']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../../../assets/images/HomeScreenPrescriptionRegistration.png')} 
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.actionButtonText}>처방전 등록</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Pill Envelope Button */}
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.8}
            onPress={onPillEnvelopeRegister}
          >
            <LinearGradient
              colors={['#6b6558', '#5a5347']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../../../assets/images/HomeScreenPrescriptionBag.png')} 
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.actionButtonText}>약봉투 등록</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Edit Info Button */}
        <TouchableOpacity 
          style={styles.editInfoButton} 
          activeOpacity={0.8}
          onPress={onEditInfo}
        >
          <LinearGradient
            colors={['#6b6558', '#5a5347']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.editInfoGradient}
          >
            <View style={styles.editIconContainer}>
              <Image 
                source={require('../../../assets/images/HomeScreenMyInfo.png')} 
                style={styles.editIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.editInfoButtonText}>내 정보 수정</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Empty State Container */}
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Image 
              source={require('../../../assets/images/HomeScreenEmptyPill.png')} 
              style={styles.emptyIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.emptyTextContainer}>
            <Text style={styles.emptyTitle}>등록된 약이 없습니다</Text>
            <Text style={styles.emptySubtitle}>처방전을 등록해주세요</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(57), // 81 - 24 (status bar height)
    paddingBottom: responsive(40),
    alignItems: 'center' as any,
  },
  headerSection: {
    width: '100%',
    maxWidth: responsive(368),
    marginBottom: responsive(24),
  },
  headingContainer: {
    // Header container
  },
  dateText: {
    fontSize: responsive(27),
    fontWeight: '700' as any,
    color: '#1e2939',
    lineHeight: responsive(32.4),
    marginBottom: responsive(5),
  },
  greetingText: {
    fontSize: responsive(16),
    fontWeight: '400' as any,
    color: '#6a7282',
    lineHeight: responsive(24),
  },
  actionButtonsContainer: {
    width: '100%',
    maxWidth: responsive(368),
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    marginBottom: responsive(24),
  },
  actionButton: {
    width: responsive(172),
    height: responsive(172),
    borderRadius: responsive(16),
    overflow: 'hidden' as any,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end' as any,
    alignItems: 'center' as any,
    paddingBottom: responsive(21),
  },
  iconContainer: {
    width: responsive(80),
    height: responsive(80),
    borderRadius: responsive(40),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: responsive(18),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  iconImage: {
    width: responsive(48),
    height: responsive(48),
  },
  actionButtonText: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#ffffff',
    lineHeight: responsive(28.8),
  },
  editInfoButton: {
    width: '100%',
    maxWidth: responsive(368),
    height: responsive(100),
    borderRadius: responsive(16),
    overflow: 'hidden' as any,
    marginBottom: responsive(24),
  },
  editInfoGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row' as any,
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    paddingHorizontal: responsive(20),
  },
  editIconContainer: {
    width: responsive(56),
    height: responsive(56),
    borderRadius: responsive(28),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: responsive(18),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  editIconImage: {
    width: responsive(32),
    height: responsive(32),
  },
  editInfoButtonText: {
    fontSize: responsive(24),
    fontWeight: '700' as any,
    color: '#ffffff',
    lineHeight: responsive(28.8),
  },
  emptyStateContainer: {
    width: responsive(368),
    height: responsive(297),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
    alignSelf: 'center',
    marginTop: responsive(40), // Distance from edit button to empty state
  },
  emptyIconCircle: {
    width: responsive(112),
    height: responsive(112),
    borderRadius: responsive(56),
    backgroundColor: '#f9fafb',
    marginBottom: responsive(44),
    justifyContent: 'center' as any,
    alignItems: 'center' as any,
  },
  emptyIconImage: {
    width: responsive(64),
    height: responsive(64),
  },
  emptyTextContainer: {
    alignItems: 'center' as any,
  },
  emptyTitle: {
    fontSize: responsive(20),
    fontWeight: '700' as any,
    color: '#4a5565',
    lineHeight: responsive(28),
    marginBottom: 0,
  },
  emptySubtitle: {
    fontSize: responsive(18),
    fontWeight: '400' as any,
    color: '#99a1af',
    lineHeight: responsive(28),
  },
});


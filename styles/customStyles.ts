import { StyleSheet, Platform } from 'react-native';

// HomeScreen Styles
export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  darkContainer: {
    backgroundColor: '#0F0F0F',
  },
  headerContainer: {
    backgroundColor: '#007AFF',
    paddingBottom: 0,
  },
  darkHeaderContainer: {
    backgroundColor: '#1A1A2E',
  },
  headerGradientBg: {
    paddingTop: Platform.OS === 'android' ? 10 : 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoIcon: {
    fontSize: 36,
  },
  brandText: {
    flex: 1,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  logoutBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: {
    fontSize: 24,
  },
  welcomeBanner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFF',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  darkStatsBar: {
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  refreshButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  darkRefreshButton: {
    backgroundColor: '#0056CC',
    shadowColor: '#0056CC',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  darkText: {
    color: '#FFF',
  },
  darkSubText: {
    color: '#B0B0B0',
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#FF9500',
  },
  darkCard: {
    backgroundColor: '#1A1A2E',
    borderLeftColor: '#00D4FF',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  orderId: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontWeight: '500',
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCompleted: {
    color: '#34C759',
  },
  statusCancelled: {
    color: '#FF3B30',
  },
  orderDetails: {
    marginBottom: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
  },
  orderInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  printBtn: {
    backgroundColor: '#007AFF',
  },
  cancelBtn: {
    backgroundColor: '#FF9500',
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  printModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 0,
  },
  darkPrintModal: {
    backgroundColor: '#FFF',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
  },
  receiptSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  closeBtn: {
    paddingHorizontal: 10,
  },
  closeBtnText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  receiptContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  receiptSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  receiptLabelBold: {
    fontSize: 14,
    color: '#333',
    fontWeight: '800',
  },
  receiptValue: {
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
    fontWeight: '600',
  },
  receiptValueBold: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'right',
    fontWeight: '800',
  },
  statusPending: {
    color: '#FF9500',
    fontWeight: '700',
  },
  statusCompletedText: {
    color: '#34C759',
    fontWeight: '700',
  },
  receiptDivider: {
    height: 2,
    backgroundColor: '#DDD',
    marginVertical: 14,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 18,
  },
  receiptThankYou: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  receiptNote: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  printModalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  printModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#F0F0F0',
  },
  confirmPrintBtn: {
    backgroundColor: '#007AFF',
  },
  printModalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  cancelBtnText: {
    color: '#333',
  },
});

// LoginScreen Styles
export const loginScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  loader: {
    marginVertical: 20,
  },
  biometricButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  biometricButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    width: '100%',
    backgroundColor: '#E8E8E8',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    marginTop: 20,
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
});

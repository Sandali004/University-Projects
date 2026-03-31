import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
  system_id?: string;
  transportation_systems?: {
    name: string;
  };
}

interface Section {
  title: string;
  data: Notification[];
}

export default function NotificationsScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndFetch();
  }, []);

  const loadUserAndFetch = async () => {
    try {
      const parentDataStr = await AsyncStorage.getItem('parentData');
      if (parentDataStr) {
        const data = JSON.parse(parentDataStr);
        setUserId(data.id);
        fetchNotifications(data.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.log('Error loading user data', error);
      setLoading(false);
    }
  };

  const fetchNotifications = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/notifications/${id}`);
      const rawNotifications: Notification[] = response.data.notifications || [];
      
      // Grouping logic
      const grouped: { [key: string]: Notification[] } = {};
      
      rawNotifications.forEach(notif => {
        const systemName = notif.transportation_systems?.name || 'General';
        if (!grouped[systemName]) grouped[systemName] = [];
        grouped[systemName].push(notif);
      });

      const sectionData = Object.keys(grouped).map(key => ({
        title: key,
        data: grouped[key]
      }));

      setSections(sectionData);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      Alert.alert('Error', 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.delete(`/notifications/${id}`);
            // Remove from local sections immediately
            setSections(prev => prev.map(section => ({
              ...section,
              data: section.data.filter(n => n.id !== id)
            })).filter(section => section.data.length > 0));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete notification.');
          }
        }
      }
    ]);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'delay': return 'clock-alert';
      case 'emergency': return 'alert';
      case 'route_change': return 'map-marker-path';
      case 'tracking_start': return 'map-marker-radius';
      case 'tracking_stop': return 'map-marker-off';
      case 'attendant_presence': return 'account-check';
      default: return 'bell';
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'delay': return '#D97706';
      case 'emergency': return '#DC2626';
      case 'route_change': return '#4F46E5';
      case 'tracking_start': return '#10B981';
      case 'tracking_stop': return '#64748B';
      case 'attendant_presence': return '#8B5CF6';
      default: return '#3B82F6';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: getColorForType(item.type) + '15' }]}>
        <MaterialCommunityIcons name={getIconForType(item.type) as any} size={22} color={getColorForType(item.type)} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <MaterialCommunityIcons name="delete-outline" size={20} color="#CBD5E1" />
      </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name="bus-school" size={18} color="#64748B" />
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Notifications</Text>
        <Text style={styles.subtitle}>Stay updated with your children's commute status.</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-off-outline" size={64} color="#E2E8F0" />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={false}
          onRefresh={() => fetchNotifications(userId!)}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 24, 
    marginBottom: 12, 
    paddingHorizontal: 8 
  },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 10, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1 
  },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  textContainer: { flex: 1 },
  messageText: { fontSize: 14, color: '#334155', fontWeight: '600', lineHeight: 20, marginBottom: 2 },
  dateText: { fontSize: 11, color: '#94A3B8' },
  deleteButton: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#94A3B8', fontSize: 16, marginTop: 16, fontWeight: '500' }
});

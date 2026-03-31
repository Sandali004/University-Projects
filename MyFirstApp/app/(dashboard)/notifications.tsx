import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
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
        setLoading(false); // Not a parent or not logged in
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
      setNotifications(response.data.notifications || []);
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
            // Remove from local state immediately for snappy UI
            setNotifications(prev => prev.filter(n => n.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete notification.');
          }
        }
      }
    ]);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getIconForType = (type: string) => {
    if (type === 'delay') return 'clock-alert';
    if (type === 'emergency') return 'alert';
    if (type === 'route_change') return 'map-marker-path';
    if (type === 'start') return 'map-marker-radius';
    if (type === 'stop') return 'map-marker-off';
    if (type === 'attendant_presence') return 'account-check';
    return 'bell'; // fallback
  };

  const getColorForType = (type: string) => {
    if (type === 'delay') return '#D97706';
    if (type === 'emergency') return '#DC2626';
    if (type === 'route_change') return '#4F46E5';
    if (type === 'start') return '#10B981';
    if (type === 'stop') return '#64748B';
    if (type === 'attendant_presence') return '#8B5CF6'; // Purple
    return '#3B82F6'; // fallback
  };

  const renderNotification = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: getColorForType(item.type) + '20' }]}>
        <MaterialCommunityIcons name={getIconForType(item.type)} size={24} color={getColorForType(item.type)} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="account-cancel" size={64} color="#CBD5E1" />
        <Text style={styles.emptyText}>You must be logged in as a Parent to view notifications.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification History</Text>
        <Text style={styles.subtitle}>Recent updates from your driver. Older items are removed automatically.</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-off-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>You have no recent notifications.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => fetchNotifications(userId)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B' },
  listContainer: { padding: 16 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2 
  },
  iconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  textContainer: { flex: 1 },
  messageText: { fontSize: 15, color: '#1E293B', fontWeight: '500', marginBottom: 4, lineHeight: 20 },
  dateText: { fontSize: 12, color: '#94A3B8' },
  deleteButton: { padding: 8, marginLeft: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#64748B', fontSize: 16, marginTop: 12, textAlign: 'center' }
});

// Admin panel — manager view of a team.
// Figma: Painel Admin section (_user/teampage)
// Three tabs: Eventos | Detalhes | Membros
// Bottom mini-nav: dashboard (bar chart) + create event (+)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/shared/Avatar';
import { MemberAvatars } from '../../src/components/team/MemberAvatars';
import { getTeam, getTeamEvents } from '../../src/services/api';
import { colors, typography, spacing, radius } from '../../src/constants/theme';
import type { Team, Event, Member } from '../../src/types';

type Tab = 'events' | 'details' | 'members';

// Status badge colors from Figma
const EVENT_STATUS = {
  now: { label: 'Now', bg: '#D1FAE5', text: '#059669' },
  new: { label: 'New', bg: colors.primaryMid, text: colors.primary },
  confirmed: { label: 'Confirmed', bg: '#D1FAE5', text: '#059669' },
  full: { label: 'Full', bg: '#FEF3C7', text: '#D97706' },
} as const;

type EventStatus = keyof typeof EVENT_STATUS;

function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  const diff = Math.abs(event.date.getTime() - now.getTime()) / 60000;
  if (diff < 120 && event.date <= now) return 'now';
  const daysSince = (now.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > -7 && event.confirmed.length === 0) return 'new';
  if (event.confirmed.length >= event.maxPlayers) return 'full';
  return 'confirmed';
}

function EventRow({ event, onPress }: { event: Event; onPress: () => void }) {
  const status = getEventStatus(event);
  const badge = EVENT_STATUS[status];
  return (
    <TouchableOpacity onPress={onPress} style={styles.eventRow} activeOpacity={0.8}>
      <View style={styles.eventRowBody}>
        <Text style={styles.eventRowTitle}>{event.title}</Text>
        <Text style={styles.eventRowMeta}>
          {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={styles.eventRowAddr} numberOfLines={1}>{event.venueAddress}</Text>
        <View style={styles.eventRowFooter}>
          <Text style={styles.eventRowConfirmed}>
            {event.confirmed.length} of {event.maxPlayers} confirmed
          </Text>
          <MemberAvatars members={event.confirmed} maxVisible={4} size={22} />
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ManageTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [team, setTeam] = useState<Team | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState(['', '']);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTeam(id), getTeamEvents(id)]).then(([t, evts]) => {
      setTeam(t ?? null);
      setEvents(evts);
      setDescription(t?.description ?? '');
      setLoading(false);
    });
  }, [id]);

  if (loading || !team) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const today = new Date();
  const todayEvents = events.filter(
    (e) => e.date.toDateString() === today.toDateString()
  );
  const upcomingEvents = events.filter((e) => e.date > today);

  const filteredMembers = team.members.filter((m) =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — matches Figma: back arrow, team name, "..." menu */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={20} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{team.name}</Text>
        <TouchableOpacity style={styles.headerMenu}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Tabs — Eventos | Detalhes | Membros */}
      <View style={styles.tabs}>
        {(['events', 'details', 'members'] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = {
            events: 'Events',
            details: 'Details',
            members: 'Members',
          };
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                {labels[tab]}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        {activeTab === 'events' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {todayEvents.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Today</Text>
                {todayEvents.map((e) => (
                  <EventRow key={e.id} event={e} onPress={() => router.push(`/live/${e.id}` as never)} />
                ))}
              </>
            )}
            <Text style={styles.sectionLabel}>Upcoming events</Text>
            {upcomingEvents.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming events</Text>
            ) : (
              upcomingEvents.map((e) => (
                <EventRow key={e.id} event={e} onPress={() => router.push(`/event/${e.id}` as never)} />
              ))
            )}
          </ScrollView>
        )}

        {activeTab === 'details' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Description field — underline style matching Figma */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.fieldInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Write something for your members"
                placeholderTextColor={colors.gray100}
                multiline
              />
              <View style={styles.fieldUnderline} />
            </View>

            {/* Links */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Links</Text>
              {links.map((link, i) => (
                <View key={i}>
                  <TextInput
                    style={styles.fieldInput}
                    value={link}
                    onChangeText={(v) => {
                      const updated = [...links];
                      updated[i] = v;
                      setLinks(updated);
                    }}
                    placeholder="www.yourlink.com"
                    placeholderTextColor={colors.gray100}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  <View style={styles.fieldUnderline} />
                </View>
              ))}
              <TouchableOpacity
                style={styles.addLinkBtn}
                onPress={() => setLinks([...links, ''])}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addLinkText}>Add new</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {activeTab === 'members' && (
          <>
            {/* Search + add member */}
            <View style={styles.memberSearchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={14} color={colors.gray500} />
                <TextInput
                  style={styles.searchInput}
                  value={memberSearch}
                  onChangeText={setMemberSearch}
                  placeholder="Search"
                  placeholderTextColor={colors.gray500}
                />
              </View>
              <TouchableOpacity style={styles.addMemberBtn}>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.memberCount}>{filteredMembers.length} members</Text>

            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <Avatar name={item.name} uri={item.avatar} size={36} />
                  <Text style={styles.memberName}>{item.name}</Text>
                  <TouchableOpacity style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.memberList}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>

      {/* Admin mini bottom nav — matches Figma: bar chart + plus */}
      <View style={styles.adminNav}>
        <TouchableOpacity
          onPress={() => router.push(`/manage/${id}/dashboard` as never)}
          style={styles.adminNavBtn}
        >
          <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/event/create?teamId=${id}` as never)}
          style={styles.adminNavBtn}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    letterSpacing: typography.tracking.tight,
  },
  headerMenu: {
    padding: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
  },
  activeTabLabel: {
    color: colors.black,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 80,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.gray500,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: spacing.md,
  },
  eventRowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  eventRowTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  eventRowMeta: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  eventRowAddr: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  eventRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  eventRowConfirmed: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    minWidth: 68,
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },

  // Details tab
  fieldBlock: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  fieldInput: {
    fontSize: typography.sizes.base,
    color: colors.black,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  fieldUnderline: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  addLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  addLinkText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },

  // Members tab
  memberSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  addMemberBtn: {
    padding: spacing.xs,
  },
  memberCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray500,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  memberList: {
    paddingHorizontal: spacing.md,
    paddingBottom: 80,
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  memberName: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  removeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  removeBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },

  // Admin nav
  adminNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  adminNavBtn: {
    padding: spacing.sm,
  },
});

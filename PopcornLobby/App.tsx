import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Screen = "home" | "lobby";

type ServiceItem = {
  id: string;
  label: string;
  logo: string;
};

type Participant = {
  id: number;
  name: string;
  role?: "HOST";
  status?: "online";
  image?: string;
};

type Message = {
  id: number;
  user: string;
  role?: "Host";
  text: string;
};

const SERVICES: ServiceItem[] = [
  { id: "music", label: "Music", logo: "MU" },
  { id: "netflix", label: "Netflix", logo: "N" },
  { id: "prime", label: "Prime", logo: "P" },
  { id: "disney", label: "Disney", logo: "D" },
  { id: "apple-tv", label: "AppleTV", logo: "AT" },
  { id: "youtube", label: "YouTube", logo: "YT" },
  { id: "paramount", label: "Paramount", logo: "PM" },
  { id: "more", label: "More", logo: "..." },
];

const PARTICIPANTS: Participant[] = [
  {
    id: 1,
    name: "Alex",
    role: "HOST",
    status: "online",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
  },
  { id: 2, name: "Inviting..." },
  { id: 3, name: "Inviting..." },
  { id: 4, name: "Inviting..." },
];

const MESSAGES: Message[] = [
  { id: 1, user: "Alex", role: "Host", text: "This battle is intense!" },
  { id: 2, user: "Sarah", text: "I cannot believe that ship!" },
  { id: 3, user: "Mike", text: "Did you see that maneuver?" },
  { id: 4, user: "Steph", text: "Looks so cool in sync!" },
];

const BG_URI =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80";
const VIDEO_STILL_URI =
  "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=1600&q=80";
const MESSAGE_AVATAR_URI =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

const GlassField = ({
  iconName,
  placeholder,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  placeholder: string;
}) => (
  <BlurView intensity={28} tint="dark" style={styles.fieldWrap}>
    <Ionicons name={iconName} size={18} color="#94A3B8" />
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#6B7280"
      style={styles.fieldInput}
    />
  </BlurView>
);

const LobbyScreen = ({ onBack }: { onBack: () => void }) => (
  <ScrollView
    style={styles.lobbyRoot}
    contentContainerStyle={styles.lobbyContent}
    showsVerticalScrollIndicator={false}
  >
    <View style={styles.lobbyHeader}>
      <Pressable style={styles.iconButton}>
        <Ionicons name="menu" size={22} color="#E5E7EB" />
      </Pressable>

      <View style={styles.lobbyHeaderCenter}>
        <View style={styles.logoWrapSmall}>
          <Text style={styles.logoWhiteSmall}>Popcorn</Text>
          <Text style={styles.logoBlueSmall}>Lobby</Text>
        </View>
        <Text style={styles.lobbySubtitle}>YOUR PRIVATE PARTY LOBBY</Text>
      </View>

      <Pressable style={styles.avatarSmall}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=120&q=80",
          }}
          style={styles.avatarImage}
        />
      </Pressable>
    </View>

    <View style={styles.participantsRow}>
      {PARTICIPANTS.map((participant) => (
        <View key={participant.id} style={styles.participantItem}>
          <View style={styles.participantAvatar}>
            {participant.image ? (
              <Image source={{ uri: participant.image }} style={styles.participantAvatarImage} />
            ) : (
              <Ionicons name="add" size={20} color="rgba(226,232,240,0.65)" />
            )}
            {participant.status === "online" ? <View style={styles.onlineDot} /> : null}
          </View>
          <Text
            style={[
              styles.participantText,
              participant.role === "HOST" ? styles.participantHostText : styles.participantInviteText,
            ]}
          >
            {participant.role ?? participant.name}
          </Text>
        </View>
      ))}
    </View>

    <View style={styles.videoCard}>
      <ImageBackground source={{ uri: VIDEO_STILL_URI }} style={styles.videoStill}>
        <View style={styles.videoOverlay}>
          <View style={styles.videoControls}>
            <Ionicons name="play-back" size={26} color="#F8FAFC" />
            <Ionicons name="pause" size={34} color="#F8FAFC" />
            <Ionicons name="play-forward" size={26} color="#F8FAFC" />
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.progressTimeRow}>
              <Text style={styles.progressTime}>00:32:15</Text>
              <Text style={styles.progressTime}>/ 02:15:50</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>

    <BlurView intensity={22} tint="dark" style={styles.chatCard}>
      <Text style={styles.chatTitle}>Party Chat</Text>
      <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
        {MESSAGES.map((message) => (
          <View key={message.id} style={styles.chatRow}>
            <Image source={{ uri: MESSAGE_AVATAR_URI }} style={styles.chatAvatar} />
            <View style={styles.chatBubble}>
              <Text style={styles.chatMeta}>
                {message.role ? `(${message.role}) ` : ""}
                {message.user}
              </Text>
              <Text style={styles.chatText}>{message.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </BlurView>

    <Pressable style={styles.manageButton} onPress={onBack}>
      <Text style={styles.manageButtonText}>Manage Lobby and Invite</Text>
    </Pressable>
  </ScrollView>
);

export default function App() {
  const [selectedService, setSelectedService] = useState("netflix");
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: BG_URI }} blurRadius={8} style={styles.background}>
        <View style={styles.dimLayer}>
          <View style={styles.warmGlow} />

          {screen === "home" ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Pressable style={styles.iconButton}>
                  <Ionicons name="menu" size={23} color="#E5E7EB" />
                </Pressable>

                <View style={styles.logoWrap}>
                  <Text style={styles.logoWhite}>Popcorn</Text>
                  <Text style={styles.logoBlue}>Lobby</Text>
                </View>

                <Pressable style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#E5E7EB" />
                </Pressable>
              </View>

              <Text style={styles.title}>CONFIGURE YOUR{"\n"}PRIVATE PARTY</Text>

              <Text style={styles.sectionLabel}>1. Choose Your Streaming Service</Text>
              <View style={styles.grid}>
                {SERVICES.map((service) => {
                  const isActive = selectedService === service.id;
                  return (
                    <Pressable
                      key={service.id}
                      onPress={() => setSelectedService(service.id)}
                      style={[styles.serviceTile, isActive && styles.serviceTileActive]}
                    >
                      <Text style={[styles.serviceLogo, isActive && styles.serviceLogoActive]}>
                        {service.logo}
                      </Text>
                      <Text style={styles.serviceLabel}>{service.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>2. Enter Video Link or Search</Text>
              <GlassField
                iconName="search"
                placeholder="Paste a URL or search for content..."
              />

              <Text style={styles.sectionLabel}>3. Name Your Party (Optional)</Text>
              <GlassField iconName="create-outline" placeholder="e.g., Friyay Movie Night" />

              <Pressable style={styles.startButton} onPress={() => setScreen("lobby")}>
                <Ionicons name="lock-closed" size={18} color="#F8FAFC" />
                <Text style={styles.startText}>Start Party and Get Invite Link</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <LobbyScreen onBack={() => setScreen("home")} />
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#030712",
  },
  background: {
    flex: 1,
  },
  dimLayer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  warmGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(217,119,6,0.20)",
    top: -40,
    right: -60,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  logoWhite: {
    color: "#F8FAFC",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  logoBlue: {
    color: "#3B82F6",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.4,
  },
  sectionLabel: {
    color: "rgba(226,232,240,0.88)",
    fontWeight: "700",
    fontSize: 14.5,
    marginBottom: 10,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  serviceTile: {
    width: "22.8%",
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  serviceTileActive: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59,130,246,0.20)",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  serviceLogo: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 17,
  },
  serviceLogoActive: {
    color: "#DBEAFE",
  },
  serviceLabel: {
    marginTop: 5,
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    fontWeight: "600",
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(17,24,39,0.55)",
    marginBottom: 12,
    overflow: "hidden",
  },
  fieldInput: {
    flex: 1,
    color: "#F8FAFC",
    marginLeft: 10,
    fontSize: 14,
  },
  startButton: {
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "rgba(191,219,254,0.35)",
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2563EB",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  startText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  lobbyRoot: {
    flex: 1,
  },
  lobbyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  lobbyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  lobbyHeaderCenter: {
    alignItems: "center",
  },
  logoWrapSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  logoWhiteSmall: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 22,
  },
  logoBlueSmall: {
    color: "#3B82F6",
    fontWeight: "800",
    fontSize: 22,
  },
  lobbySubtitle: {
    marginTop: 2,
    fontSize: 9.5,
    letterSpacing: 1.3,
    color: "rgba(226,232,240,0.66)",
  },
  avatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  participantsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  participantItem: {
    alignItems: "center",
    width: "23%",
  },
  participantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  participantAvatarImage: {
    width: "100%",
    height: "100%",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#020617",
  },
  participantText: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "700",
  },
  participantHostText: {
    color: "#F8FAFC",
  },
  participantInviteText: {
    color: "rgba(248,250,252,0.45)",
  },
  videoCard: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
    backgroundColor: "#000000",
  },
  videoStill: {
    flex: 1,
  },
  videoOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  videoControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(226,232,240,0.25)",
    marginBottom: 4,
  },
  progressFill: {
    width: "40%",
    height: 4,
    borderRadius: 4,
    backgroundColor: "#F8FAFC",
  },
  progressTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTime: {
    fontSize: 10,
    color: "#F8FAFC",
  },
  chatCard: {
    minHeight: 250,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: "hidden",
    backgroundColor: "rgba(17,24,39,0.45)",
  },
  chatTitle: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 10,
  },
  chatScroll: {
    flex: 1,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },
  chatAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 9,
  },
  chatBubble: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chatMeta: {
    color: "rgba(248,250,252,0.58)",
    fontWeight: "700",
    fontSize: 11,
    marginBottom: 2,
  },
  chatText: {
    color: "#F8FAFC",
    fontSize: 13.5,
  },
  manageButton: {
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 999,
    backgroundColor: "#F97316",
    borderWidth: 1,
    borderColor: "rgba(255,237,213,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    shadowColor: "#F97316",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  manageButtonText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
});

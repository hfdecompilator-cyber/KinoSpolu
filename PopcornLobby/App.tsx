import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ServiceItem = {
  id: string;
  label: string;
  logo: string;
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

const BG_URI =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80";

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

export default function App() {
  const [selectedService, setSelectedService] = useState("netflix");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: BG_URI }} blurRadius={8} style={styles.background}>
        <View style={styles.dimLayer}>
          <View style={styles.warmGlow} />
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

            <Pressable style={styles.startButton}>
              <Ionicons name="lock-closed" size={18} color="#F8FAFC" />
              <Text style={styles.startText}>Start Party and Get Invite Link</Text>
            </Pressable>
          </ScrollView>
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
});

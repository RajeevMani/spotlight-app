import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/create.styles";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";

import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useUser(); // ✅ important

  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    // ✅ FIX 1: user check
    if (!user) {
      alert("Please wait...");
      return;
    }

    // ✅ FIX 2: image check
    if (!selectedImage) {
      alert("Select image first");
      return;
    }

    try {
      setIsSharing(true);

      const uploadUrl = await generateUploadUrl();
      console.log("UPLOAD URL:", uploadUrl);

      // ✅ FIX 3: uploadUrl check
      if (!uploadUrl) {
        alert("Upload failed, try again");
        return;
      }

      const uploadResult = await FileSystem.uploadAsync(
  uploadUrl,
  selectedImage,
  {
    httpMethod: "POST",
    mimeType: "image/jpeg",
  }
);

      if (uploadResult.status !== 200) {
        alert("Upload failed");
        return;
      }

      const { storageId } = JSON.parse(uploadResult.body);

      await createPost({
        storageId,
        caption,
      });

      // ✅ reset
      setSelectedImage(null);
      setCaption("");

      router.push("/(tabs)");
    } catch (error) {
      console.log("Error sharing post", error);
      alert("Something went wrong");
    } finally {
      setIsSharing(false);
    }
  };

  if (!selectedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 28 }} />
        </View>

        <TouchableOpacity style={styles.emptyImageContainer} onPress={pickImage}>
          <Ionicons name="image-outline" size={48} color={COLORS.grey} />
          <Text style={styles.emptyImageText}>Tap to select an image</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setSelectedImage(null);
            setCaption("");
          }}
          disabled={isSharing}
        >
          <Ionicons name="close-outline" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Post</Text>

        <TouchableOpacity onPress={handleShare} disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.shareText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView>
      <Image
  source={{ uri: selectedImage }}
  style={styles.previewImage}
/>

        <View style={styles.captionContainer}>
          <Image source={user?.imageUrl} style={styles.userAvatar} />

          <TextInput
            placeholder="Write a caption..."
            value={caption}
            onChangeText={setCaption}
            style={styles.captionInput}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
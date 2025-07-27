import React from "react";
import { Avatar, Box, Text } from "zmp-ui";
import { useAuth } from "../contexts/AuthContext";

const UserCard = () => {
  // ✅ OPTIMIZED: Use AuthContext instead of Recoil
  const { userInfo } = useAuth();

  if (!userInfo) {
    return (
      <Box flex>
        <Avatar story="default">
          Guest
        </Avatar>
        <Box ml={4}>
          <Text.Title>Guest User</Text.Title>
          <Text>No user info</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex>
      <Avatar
        story="default"
        online
        src={userInfo.avatar?.startsWith("http") ? userInfo.avatar : undefined}
      >
        {userInfo.avatar || userInfo.name?.[0] || "U"}
      </Avatar>
      <Box ml={4}>
        <Text.Title>{userInfo.name || "Unknown User"}</Text.Title>
        <Text>{userInfo.id || "No ID"}</Text>
      </Box>
    </Box>
  );
};

export default UserCard;

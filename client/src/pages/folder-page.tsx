import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import HomePage from "./home-page";

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const folderId = parseInt(id);

  // For now, this will render the same as HomePage but filtered by folder
  // You can extend this to show folder-specific content
  return <HomePage />;
}

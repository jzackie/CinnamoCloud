import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star, Medal, Crown, Target } from "lucide-react";
import { useLanguage } from "@/lib/language-provider";
import type { Achievement, UserAchievement } from "@shared/schema";

interface AchievementData {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  newUnlocked: UserAchievement[];
}

const achievementIcons: Record<string, any> = {
  early_adopter: Crown,
  first_upload: Star,
  file_collector: Trophy,
  organizer: Target,
  image_lover: Award,
  video_enthusiast: Medal,
  document_keeper: Trophy,
  favorite_finder: Star,
  storage_master: Crown,
  folder_architect: Target,
  nested_genius: Award,
  star_collector: Medal,
  mega_storage: Crown,
  archive_master: Trophy,
  cloud_champion: Crown
};

export default function AchievementsPage() {
  const { t } = useLanguage();
  
  const { data: achievementData, isLoading } = useQuery<AchievementData>({
    queryKey: ["/api/achievements"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!achievementData) return null;

  const { achievements, userAchievements } = achievementData;
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

  const getProgressForAchievement = (achievement: Achievement) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
    if (userAchievement) {
      return Math.min(userAchievement.progress, achievement.requirement);
    }
    return 0;
  };

  const isUnlocked = (achievementId: number) => unlockedIds.has(achievementId);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("achievements.title")}</h1>
        <p className="text-muted-foreground">{t("achievements.description")}</p>
        <div className="mt-4">
          <Badge variant="secondary" className="mr-2">
            {userAchievements.length} / {achievements.length} {t("achievements.unlocked")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => {
          const IconComponent = achievementIcons[achievement.key] || Trophy;
          const unlocked = isUnlocked(achievement.id);
          const progress = getProgressForAchievement(achievement);
          const progressPercentage = (progress / achievement.requirement) * 100;

          return (
            <Card 
              key={achievement.id} 
              className={`transition-all duration-300 ${
                unlocked 
                  ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20" 
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <IconComponent 
                    className={`h-8 w-8 ${
                      unlocked 
                        ? "text-yellow-600 dark:text-yellow-400" 
                        : "text-gray-400 dark:text-gray-600"
                    }`} 
                  />
                  {unlocked && (
                    <Badge className="bg-yellow-500 text-white">
                      {t("achievements.completed")}
                    </Badge>
                  )}
                </div>
                <CardTitle className={`text-lg ${unlocked ? "text-yellow-800 dark:text-yellow-200" : ""}`}>
                  {achievement.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {achievement.description}
                </CardDescription>
                
                {!unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("achievements.progress")}</span>
                      <span>{progress} / {achievement.requirement}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("achievements.points")}: {achievement.points}</span>
                  {achievement.category && (
                    <Badge variant="outline" className="text-xs">
                      {achievement.category}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
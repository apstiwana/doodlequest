import { Scene, SCENE_CONFIG } from "@/types/game";
import { useLanguage } from "@/context/LanguageContext";

interface SceneSelectorProps {
  currentScene: Scene;
  onSceneChange: (scene: Scene) => void;
}

const scenes: Scene[] = ["forest", "underwater", "city", "moon", "space"];

export function SceneSelector({ currentScene, onSceneChange }: SceneSelectorProps) {
  const { t } = useLanguage();
  const sceneLabels: Record<Scene, string> = {
    forest: t.sceneForest,
    underwater: t.sceneUnderwater,
    city: t.sceneCity,
    moon: t.sceneMoon,
    space: t.sceneSpace,
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 bg-card/80 backdrop-blur-md border border-border/50 rounded-full px-2 py-2 shadow-xl">
        {scenes.map((scene) => {
          const config = SCENE_CONFIG[scene];
          const isActive = scene === currentScene;
          return (
            <button
              key={scene}
              onClick={() => onSceneChange(scene)}
              title={sceneLabels[scene]}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-xl
                transition-all duration-200 ease-in-out
                ${isActive
                  ? "bg-primary shadow-md shadow-primary/40 scale-110"
                  : "hover:bg-muted hover:scale-105 active:scale-95"
                }
              `}
            >
              {config.emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

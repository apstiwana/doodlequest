import { useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { DrawingUpload } from "@/components/DrawingUpload";
import { CharacterCustomizer } from "@/components/CharacterCustomizer";
import { GameStage } from "@/components/GameStage";

type AppStep = "welcome" | "upload" | "customize" | "game";

const Index = () => {
  const [step, setStep] = useState<AppStep>("welcome");
  const [playerName, setPlayerName] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [characterSize, setCharacterSize] = useState(180);
  const [characterColorFilter, setCharacterColorFilter] = useState("");

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setStep("upload");
  };

  const handleDrawingComplete = (imageUrl: string, description: string) => {
    setCharacterImageUrl(imageUrl);
    setCharacterDescription(description);
    setStep("customize");
  };

  const handleCustomizeComplete = (imageUrl: string, description: string, size: number, colorFilter: string) => {
    setCharacterImageUrl(imageUrl);
    setCharacterDescription(description);
    setCharacterSize(size);
    setCharacterColorFilter(colorFilter);
    setStep("game");
  };

  if (step === "welcome") {
    return <WelcomeScreen onStart={handleNameSubmit} />;
  }

  if (step === "upload") {
    return (
      <DrawingUpload
        playerName={playerName}
        onComplete={handleDrawingComplete}
      />
    );
  }

  if (step === "customize") {
    return (
      <CharacterCustomizer
        playerName={playerName}
        imageDataUrl={characterImageUrl}
        description={characterDescription}
        onComplete={handleCustomizeComplete}
        onBack={() => setStep("upload")}
      />
    );
  }

  return (
    <GameStage
      playerName={playerName}
      characterImageUrl={characterImageUrl}
      characterDescription={characterDescription}
      characterSize={characterSize}
    />
  );
};

export default Index;

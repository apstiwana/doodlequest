import { useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { DrawingUpload } from "@/components/DrawingUpload";
import { GameStage } from "@/components/GameStage";

type AppStep = "welcome" | "upload" | "game";

const Index = () => {
  const [step, setStep] = useState<AppStep>("welcome");
  const [playerName, setPlayerName] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setStep("upload");
  };

  const handleDrawingComplete = (imageUrl: string, description: string) => {
    setCharacterImageUrl(imageUrl);
    setCharacterDescription(description);
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

  return (
    <GameStage
      playerName={playerName}
      characterImageUrl={characterImageUrl}
      characterDescription={characterDescription}
    />
  );
};

export default Index;

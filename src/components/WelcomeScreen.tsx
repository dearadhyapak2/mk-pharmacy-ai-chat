import fetterAiLogo from "@/assets/fetter-ai-logo.jpg";

const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center px-6 animate-slide-up">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
          <img
            src={fetterAiLogo}
            alt="Fetter AI Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-3">
          नमस्ते! <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          मैं आपकी किस प्रकार मदद कर सकता हूँ?
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;

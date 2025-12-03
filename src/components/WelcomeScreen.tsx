const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center px-6 animate-slide-up">
        <h1 className="text-4xl font-bold text-primary mb-3">
          नमस्ते! <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          मैं आपकी स्वास्थ्य सेवा में कैसे मदद कर सकता हूं?
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;

const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center px-6 animate-slide-up">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          नमस्ते! <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-base text-muted-foreground">
          आज आपकी क्या मदद करूं?
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;

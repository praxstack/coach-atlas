/**
 * SettingsPage - API Configuration
 * Uses StorageService for persistence (IndexedDB)
 */
import { useStorageService } from "@/app/ServiceContext";
import { Provider, providers } from "@/services/providers";
import { Button } from "@/shared/ui/button";
import {
  ArrowLeft,
  Check,
  Key,
  MapPin,
  Shield,
  Sparkles,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface StoredConfig {
  provider: string;
  apiKey: string;
  model: string;
  region?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const storageService = useStorageService();

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [region, setRegion] = useState<string>("us-east-1");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedConfig, setSavedConfig] = useState<StoredConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing config from IndexedDB
  const loadConfiguration = useCallback(async () => {
    try {
      const config = await storageService.loadProviderConfig();
      if (config) {
        setSavedConfig(config);
        setSelectedProvider(config.provider as Provider);
        setSelectedModel(config.model);
        setApiKey(config.apiKey);
        if (config.region) {
          setRegion(config.region);
        }
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  const handleProviderSelect = (providerId: Provider) => {
    setSelectedProvider(providerId);
    setSelectedModel("");
    setApiKey("");
    setRegion("us-east-1");
    setShowApiKey(false);
  };

  const isFormValid = () => {
    if (!selectedProvider || !selectedModel || !apiKey.trim()) return false;
    // Bedrock requires region
    if (selectedProvider === 'bedrock' && !region.trim()) return false;
    return true;
  };

  const handleSave = async () => {
    if (!selectedProvider || !selectedModel || !apiKey.trim()) return;

    try {
      const configToSave: StoredConfig = {
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKey.trim(),
      };

      // Add region for Bedrock
      if (selectedProvider === 'bedrock' && region.trim()) {
        configToSave.region = region.trim();
      }

      await storageService.saveProviderConfig(configToSave);
      setSavedConfig(configToSave);
      toast.success("API configuration saved successfully!");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Failed to save configuration");
    }
  };

  const handleClear = async () => {
    try {
      await storageService.deleteSetting("provider");
      await storageService.deleteSetting("apiKey");
      await storageService.deleteSetting("model");
      await storageService.deleteSetting("region");

      setSavedConfig(null);
      setSelectedProvider(null);
      setSelectedModel("");
      setApiKey("");
      setRegion("us-east-1");
      toast.success("Configuration cleared");
    } catch (err) {
      console.error("Failed to clear config:", err);
      toast.error("Failed to clear configuration");
    }
  };

  const handleStartChat = () => {
    if (savedConfig) {
      navigate("/chat");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">API Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Bring your own API keys
            </p>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl">
        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-8">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              Your keys stay local
            </p>
            <p className="text-muted-foreground">
              API keys are stored securely in your browser's IndexedDB and never
              sent to our servers. They're used directly to communicate with
              your chosen AI provider.
            </p>
          </div>
        </div>

        {/* Current Config Status */}
        {savedConfig && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {providers.find((p) => p.id === savedConfig.provider)?.name}{" "}
                  configured
                </p>
                <p className="text-sm text-muted-foreground">
                  Model:{" "}
                  {
                    providers
                      .find((p) => p.id === savedConfig.provider)
                      ?.models.find((m) => m.id === savedConfig.model)?.name
                  }
                  {savedConfig.region && ` • Region: ${savedConfig.region}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button size="sm" onClick={handleStartChat}>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </div>
        )}

        {/* Provider Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
              1
            </span>
            Choose Provider
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedProvider === provider.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{provider.name}</span>
                  {selectedProvider === provider.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        {currentProvider && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                2
              </span>
              Select Model
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {currentProvider.models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedModel === model.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {model.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* API Key Input */}
        {currentProvider && selectedModel && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">
                3
              </span>
              Enter Credentials
            </h2>
            <div className="space-y-4">
              {/* API Key Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {currentProvider.fields[0]?.label || "API Key"}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={currentProvider.fields[0]?.placeholder || "Enter your API key"}
                    className="w-full bg-secondary border border-border rounded-xl pl-10 pr-12 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Region Field (Bedrock only) */}
              {currentProvider.id === "bedrock" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    AWS Region
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Common regions: us-east-1, us-west-2, eu-west-1, ap-northeast-1
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {currentProvider.id === "bedrock"
                  ? "Enter your Bedrock API key and the AWS region where you have Bedrock access."
                  : "Get your API key from the provider's console."}
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        {currentProvider && (
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={!isFormValid()}
              className="flex-1"
              size="lg"
            >
              <Key className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;

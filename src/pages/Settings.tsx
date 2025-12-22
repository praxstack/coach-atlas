import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  providers, 
  Provider, 
  ProviderConfig, 
  saveConfig, 
  loadConfig, 
  clearConfig,
  StoredConfig 
} from "@/lib/providers";
import { 
  ArrowLeft, 
  Check, 
  Key, 
  Shield, 
  Sparkles,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [savedConfig, setSavedConfig] = useState<StoredConfig | null>(null);

  useEffect(() => {
    const config = loadConfig();
    if (config) {
      setSavedConfig(config);
      setSelectedProvider(config.provider);
      setSelectedModel(config.model);
      setCredentials(config.credentials);
    }
  }, []);

  const currentProvider = providers.find(p => p.id === selectedProvider);

  const handleProviderSelect = (providerId: Provider) => {
    setSelectedProvider(providerId);
    setSelectedModel("");
    setCredentials({});
    setShowPasswords({});
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isFormValid = () => {
    if (!selectedProvider || !selectedModel) return false;
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return false;
    return provider.fields.every(field => credentials[field.key]?.trim());
  };

  const handleSave = () => {
    if (!selectedProvider || !selectedModel) return;
    
    const config: StoredConfig = {
      provider: selectedProvider,
      model: selectedModel,
      credentials,
    };
    
    saveConfig(config);
    setSavedConfig(config);
    toast.success("API configuration saved successfully!");
  };

  const handleClear = () => {
    clearConfig();
    setSavedConfig(null);
    setSelectedProvider(null);
    setSelectedModel("");
    setCredentials({});
    toast.success("Configuration cleared");
  };

  const handleStartChat = () => {
    if (savedConfig) {
      navigate("/chat");
    }
  };

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
            <p className="text-sm text-muted-foreground">Bring your own API keys</p>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-4xl">
        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-8">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Your keys stay local</p>
            <p className="text-muted-foreground">
              API keys are stored in your browser's local storage and never sent to our servers.
              They're used directly to communicate with your chosen AI provider.
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
                  {providers.find(p => p.id === savedConfig.provider)?.name} configured
                </p>
                <p className="text-sm text-muted-foreground">
                  Model: {providers.find(p => p.id === savedConfig.provider)?.models.find(m => m.id === savedConfig.model)?.name}
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
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">1</span>
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
                <p className="text-sm text-muted-foreground">{provider.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        {currentProvider && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">2</span>
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
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Credentials */}
        {currentProvider && selectedModel && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center">3</span>
              Enter Credentials
            </h2>
            <div className="space-y-4">
              {currentProvider.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                      value={credentials[field.key] || ""}
                      onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-secondary border border-border rounded-xl pl-10 pr-12 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
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

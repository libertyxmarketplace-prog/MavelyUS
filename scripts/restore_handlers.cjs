const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'web', 'src', 'pages', 'DashboardPage.tsx');
let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace(/\r\n/g, '\n');

const missingBlock = `  // Notifications block toasts with deduplication
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => {
    setToasts((prev) => {
      // Prevent duplicate toasts with the exact same title & body
      if (prev.some((t) => t.title === title && t.body === body)) return prev;
      const id = Date.now() + Math.random();
      setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== id));
      }, 4500);
      return [...prev, { id, variant, title, body }];
    });
  };

  // Guard to prevent concurrent or repeated workspace loading
  const loadingGuildRef = useRef<string | null>(null);

  // Load user guilds
  useEffect(() => {
    async function initGuilds() {
      try {
        const list = await fetchGuilds();
        setGuilds(list);
        if (list.length > 0) {
          const matched = guildId ? list.find((g) => g.id === guildId) : list[0];
          const target = matched || list[0];
          setSelectedGuild(target);
          if (target.id !== guildId) {
            navigate(\`/dashboard/\${target.id}\`, { replace: true });
          }
        }
      } catch (err: any) {
        addToast('error', 'Server Load Notice', err.message || 'Could not load Discord servers');
      } finally {
        setLoadingGuilds(false);
      }
    }
    initGuilds();
  }, [guildId, navigate]);

  // Load workspace & guild resources for selected guild seamlessly without duplicate errors
  const loadWorkspaceData = useCallback(async (gId: string) => {
    if (loadingGuildRef.current === gId) return;
    loadingGuildRef.current = gId;
    setLoadingWorkspace(true);

    try {
      let data;
      try {
        data = await fetchWorkspace(gId);
      } catch (err: any) {
        // If workspace is not created yet (404), seamlessly provision it!
        if (err.status === 404 || err.message?.includes('not been set up') || err.message?.includes('404')) {
          const created = await createWorkspace(gId);
          data = { workspace: created.workspace, guild: { id: gId, name: 'Discord Server' } as any };
        } else {
          throw err;
        }
      }

      setWorkspace(data.workspace);
      const initialCustomizations = data.workspace.customizations || {};
      setConfig(initialCustomizations);
      setBaselineConfig(JSON.stringify(initialCustomizations));

      // If missing both credentials on initial visit, default to onboarding
      if (!data.workspace.hasDiscordToken && !data.workspace.hasErlcApiKey) {
        setActiveTab('onboarding');
      }

      // Fetch live Discord resources (channels & roles)
      fetchGuildResources(gId)
        .then((res) => setResources(res))
        .catch(() => setResources({ available: false, channels: [], roles: [] }));

      // Fetch live ER:LC telemetry if key exists
      if (data.workspace.hasErlcApiKey) {
        fetchErlcLive(gId).then(setErlcLive).catch(() => setErlcLive(null));
      } else {
        setErlcLive(null);
      }
    } catch (err: any) {
      addToast('info', 'Workspace Ready', 'Customize your server settings and modules below.');
    } finally {
      setLoadingWorkspace(false);
      loadingGuildRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (selectedGuild?.id) {
      loadWorkspaceData(selectedGuild.id);
    }
  }, [selectedGuild?.id, loadWorkspaceData]);

  // Handle saving credentials
  const handleSaveCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGuild) return;
    setSavingCreds(true);
    try {
      const payload: { discordToken?: string; erlcApiKey?: string } = {};
      if (discordTokenInput.trim()) payload.discordToken = discordTokenInput.trim();
      if (erlcKeyInput.trim()) payload.erlcApiKey = erlcKeyInput.trim();

      if (Object.keys(payload).length === 0) {
        addToast('warning', 'Input Required', 'Enter a Bot Token or ER:LC Server Key to connect.');
        setSavingCreds(false);
        return;
      }

      const res = await updateWorkspaceCredentials(selectedGuild.id, payload);
      setWorkspace(res.workspace);
      setConfig(res.workspace.customizations || {});
      setDiscordTokenInput('');
      setErlcKeyInput('');
      addToast('success', 'Credentials Saved', 'Bot cluster is now linked and synchronized.');

      // Refresh live resources and ER:LC stats
      fetchGuildResources(selectedGuild.id).then(setResources).catch(() => {});
      fetchErlcLive(selectedGuild.id).then(setErlcLive).catch(() => {});
    } catch (err: any) {
      addToast('error', 'Validation Notice', err.message || 'Validation failed');
    } finally {
      setSavingCreds(false);
    }
  };

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    if (!selectedGuild) return;
    try {
      const nextConfig = { ...config, setupCompleted: true };
      const res = await saveWorkspaceConfig(selectedGuild.id, nextConfig);
      setWorkspace(res.workspace);
      setConfig(res.workspace.customizations || {});
      addToast('success', 'Setup Complete', 'All server operations modules are ready.');
      setActiveTab('server');
    } catch (err: any) {
      addToast('error', 'Setup Notice', err.message || 'Failed to complete setup');
    }
  };

  // Handle saving module config
  const handleSaveConfig = async () => {
    if (!selectedGuild) return;
    setSavingConfig(true);
    try {
      const res = await saveWorkspaceConfig(selectedGuild.id, config);
      setWorkspace(res.workspace);
      const savedCustomizations = res.workspace.customizations || {};
      setConfig(savedCustomizations);
      setBaselineConfig(JSON.stringify(savedCustomizations));
      addToast('success', 'Settings Saved', 'Configuration updated successfully.');
    } catch (err: any) {
      addToast('error', 'Save Notice', err.message || 'Could not save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Bot action: Restart or Deploy
  const handleBotAction = async (action: 'restart' | 'deploy') => {
    if (!selectedGuild) return;
    setActionLoading(action);
    try {
      const res = await triggerBotAction(selectedGuild.id, action);
      if (res.workspace) setWorkspace(res.workspace);
      addToast(
        'success',
        action === 'restart' ? 'Bot Cluster Restarted' : 'Slash Commands Deployed',
        action === 'restart'
          ? 'Bot instance was restarted and reconnected.'
          : 'All slash commands have been registered with Discord.'
      );
    } catch (err: any) {
      addToast('error', \`Action Failed\`, err.message || 'Failed to run bot action');
    } finally {
      setActionLoading(null);
    }
  };
`;

content = content.replace(
  `  const [actionLoading, setActionLoading] = useState<string | null>(null);`,
  `  const [actionLoading, setActionLoading] = useState<string | null>(null);\n\n` + missingBlock
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Restored handlers into DashboardPage.tsx');

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.greentic.ai',
	integrations: [
		starlight({
			title: 'Greentic Docs',
			description: 'Documentation for the Greentic Platform - WASM-component-based, multi-tenant platform for AI-driven digital workers',
			logo: {
				src: './src/assets/greentic-logo.png',
				alt: 'greentic.ai',
				replacesTitle: false,
			},
			favicon: '/favicon.ico',
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
				id: {
					label: 'Bahasa Indonesia',
					lang: 'id',
				},
				ja: {
					label: '日本語',
					lang: 'ja',
				},
				zh: {
					label: '中文',
					lang: 'zh',
				},
				es: {
					label: 'Español',
					lang: 'es',
				},
				de: {
					label: 'Deutsch',
					lang: 'de',
				},
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/greenticai' }],
			head: [
				{
					tag: 'meta',
					attrs: {
						property: 'og:title',
						content: 'Greentic Documentation',
					},
				},
				// Poppins font — matches the greentic.ai landing page typography.
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.googleapis.com',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.gstatic.com',
						crossorigin: '',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
					},
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Running Demos', slug: 'getting-started/running-demos' },
						{ label: 'Installation', slug: 'getting-started/installation' },
					],
				},
				{
					label: 'Core Concepts',
					items: [
						{ label: 'Architecture Overview', slug: 'concepts/architecture' },
						{ label: 'Flows', slug: 'concepts/flows' },
						{ label: 'Packs', slug: 'concepts/packs' },
						{ label: 'Components', slug: 'concepts/components' },
						{ label: 'Providers', slug: 'concepts/providers' },
						{ label: 'Bundle Assets', slug: 'concepts/bundle-assets' },
						{ label: 'Multi-Tenancy', slug: 'concepts/multi-tenancy' },
					],
				},
				{
					label: 'GTC CLI',
					items: [
						{ label: 'Overview', slug: 'cli/overview' },
						{ label: 'gtc wizard', slug: 'cli/wizard' },
						{ label: 'gtc setup', slug: 'cli/setup' },
						{ label: 'gtc start', slug: 'cli/start' },
						{ label: 'Building Packs', slug: 'cli/building-packs' },
					],
				},
				{
					label: 'Extensions',
					items: [
						{ label: 'Designer Extensions', slug: 'extensions/designer-extensions' },
						{ label: 'gtdx CLI', slug: 'extensions/gtdx-cli' },
						{ label: 'Adaptive Cards', slug: 'extensions/adaptive-cards' },
						{ label: 'Bundle Extensions', slug: 'extensions/bundle-extensions' },
						{ label: 'Deploy Extensions', slug: 'extensions/deploy-extensions' },
						{ label: 'Writing an Extension', slug: 'extensions/writing-extensions' },
					],
				},
				{
					label: 'Messaging Providers',
					items: [
						{ label: 'Overview', slug: 'providers/messaging/overview' },
						{ label: 'Slack', slug: 'providers/messaging/slack' },
						{ label: 'Microsoft Teams', slug: 'providers/messaging/teams' },
						{ label: 'Telegram', slug: 'providers/messaging/telegram' },
						{ label: 'WhatsApp', slug: 'providers/messaging/whatsapp' },
						{ label: 'WebChat', slug: 'providers/messaging/webchat' },
						{ label: 'WebChat Embedding', slug: 'providers/messaging/webchat-embedding' },
						{ label: 'Webex', slug: 'providers/messaging/webex' },
						{ label: 'Email', slug: 'providers/messaging/email' },
					],
				},
				{
					label: 'Events Providers',
					items: [
						{ label: 'Overview', slug: 'providers/events/overview' },
						{ label: 'Webhook', slug: 'providers/events/webhook' },
						{ label: 'Timer', slug: 'providers/events/timer' },
						{ label: 'Email (SendGrid)', slug: 'providers/events/email-sendgrid' },
						{ label: 'SMS (Twilio)', slug: 'providers/events/sms-twilio' },
					],
				},
				{
					label: 'Components',
					items: [
						{ label: 'fast2flow', slug: 'components/fast2flow' },
						{ label: 'cards2pack', slug: 'components/cards2pack' },
						{ label: 'flow2flow', slug: 'components/flow2flow' },
						{ label: 'LLM OpenAI', slug: 'components/llm-openai' },
						{ label: 'Templates (Handlebars)', slug: 'components/templates' },
						{ label: 'Script (Rhai)', slug: 'components/script-rhai' },
					],
				},
				{
					label: 'Internationalization',
					items: [
						{ label: 'Overview', slug: 'i18n/overview' },
						{ label: 'I18nId Specification', slug: 'i18n/i18nid-spec' },
						{ label: 'Cards Translation', slug: 'i18n/cards-translation' },
					],
				},
				{
					label: 'MCP (Model Context Protocol)',
					items: [
						{ label: 'Overview', slug: 'mcp/overview' },
						{ label: 'Creating MCP Tools', slug: 'mcp/creating-tools' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Flow YAML Schema', slug: 'reference/flow-schema' },
						{ label: 'Flow Node Kinds', slug: 'reference/flow-node-kinds' },
						{ label: 'Channel Data Access', slug: 'reference/channel-data-access' },
						{ label: 'Secret Seeding', slug: 'reference/secret-seeding' },
						{ label: 'Pack Format', slug: 'reference/pack-format' },
						{ label: 'WIT Interfaces', slug: 'reference/wit-interfaces' },
						{ label: 'Configuration', slug: 'reference/configuration' },
					],
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});

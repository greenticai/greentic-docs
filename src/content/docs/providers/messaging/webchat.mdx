---
title: WebChat
description: Embed a chat widget in your website
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Overview

The WebChat provider lets you embed a chat widget directly in your website. It supports:

- Real-time messaging
- Adaptive Cards
- File uploads
- Custom theming
- Mobile responsive

## Architecture

```
User's Browser
    │
    ▼ WebSocket
┌─────────────────────────────────────────┐
│          WebChat Widget (React)         │
│     (greentic-webchat component)        │
└─────────────────────────────────────────┘
    │
    ▼ Direct Line Protocol
┌─────────────────────────────────────────┐
│        Direct Line Server               │
│   (greentic-messaging-providers)        │
└─────────────────────────────────────────┘
    │
    ▼ NATS
┌─────────────────────────────────────────┐
│          Greentic Runner                │
└─────────────────────────────────────────┘
```

## Setup

<Steps>

1. **Configure Provider**

   ```json title="answers.json"
   {
     "messaging-webchat": {
       "enabled": true,
       "public_base_url": "https://your-domain.com",
       "allowed_origins": ["https://yoursite.com"],
       "session_timeout": 1800
     }
   }
   ```

2. **Run Setup**

   ```bash
   gtc setup --answers answers.json ./my-bundle
   ```

3. **Start Runtime**

   ```bash
   gtc start ./my-bundle
   ```

4. **Embed in Website**

   Add the widget to your HTML:

   ```html
   <script src="https://your-domain.com/webchat/widget.js"></script>
   <script>
     GreenticWebChat.init({
       directLine: {
         domain: 'https://your-domain.com/webchat',
         webSocket: true
       },
       tenant: 'demo',
       team: 'default',
       theme: {
         primaryColor: '#0078D4'
       }
     });
   </script>
   ```

</Steps>

## Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `enabled` | Yes | Enable/disable provider |
| `public_base_url` | Yes | Base URL for Direct Line |
| `allowed_origins` | No | CORS allowed origins |
| `session_timeout` | No | Session timeout in seconds (default: 1800) |
| `token_expiry` | No | Token expiry in seconds (default: 3600) |

## Widget Configuration

### Basic Setup

```html
<script src="https://your-domain.com/webchat/widget.js"></script>
<script>
  GreenticWebChat.init({
    directLine: {
      domain: 'https://your-domain.com/webchat'
    },
    tenant: 'demo',
    team: 'default'
  });
</script>
```

### With Theming

```html
<script>
  GreenticWebChat.init({
    directLine: {
      domain: 'https://your-domain.com/webchat'
    },
    tenant: 'demo',
    team: 'default',
    theme: {
      primaryColor: '#0078D4',
      backgroundColor: '#f5f5f5',
      bubbleBackground: '#ffffff',
      bubbleFromUserBackground: '#0078D4',
      bubbleTextColor: '#333333',
      bubbleFromUserTextColor: '#ffffff',
      sendBoxBackground: '#ffffff',
      sendBoxTextColor: '#333333'
    }
  });
</script>
```

### With User Info

```html
<script>
  GreenticWebChat.init({
    directLine: {
      domain: 'https://your-domain.com/webchat'
    },
    tenant: 'demo',
    team: 'default',
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    }
  });
</script>
```

### Minimized Start

```html
<script>
  GreenticWebChat.init({
    directLine: {
      domain: 'https://your-domain.com/webchat'
    },
    tenant: 'demo',
    team: 'default',
    startMinimized: true,
    showToggleButton: true
  });
</script>
```

## Features

### Text Messages

```yaml
- id: reply
  type: reply
  config:
    message: "Hello! How can I help you today?"
```

### Adaptive Cards

WebChat has full Adaptive Card support:

```yaml
- id: welcome_card
  type: adaptive-card
  config:
    card:
      type: AdaptiveCard
      version: "1.4"
      body:
        - type: TextBlock
          text: "Welcome!"
          size: Large
          weight: Bolder
        - type: TextBlock
          text: "I'm your virtual assistant. How can I help?"
        - type: ActionSet
          actions:
            - type: Action.Submit
              title: "Get Help"
              data:
                action: "help"
            - type: Action.Submit
              title: "Contact Support"
              data:
                action: "support"
```

### Quick Replies (Suggested Actions)

```yaml
- id: suggestions
  type: reply
  config:
    message: "What would you like to do?"
    suggested_actions:
      - "Check Order Status"
      - "Talk to Support"
      - "View FAQs"
```

### File Uploads

Enable file uploads:

```javascript
GreenticWebChat.init({
  // ... other config
  uploadEnabled: true,
  uploadAccept: '.pdf,.doc,.docx,.png,.jpg',
  uploadMaxSize: 10485760  // 10MB
});
```

Handle uploads in flow:

```yaml
- id: handle_upload
  type: branch
  config:
    conditions:
      - expression: "attachments.length > 0"
        next: process_file
      default: normal_message

- id: process_file
  type: reply
  config:
    message: "Thanks! I've received your file: {{attachments[0].name}}"
```

### Typing Indicator

```yaml
- id: thinking
  type: reply
  config:
    typing: true
    typing_duration: 2000  # milliseconds
  next: actual_reply

- id: actual_reply
  type: reply
  config:
    message: "Here's what I found..."
```

## API Integration

### JavaScript API

```javascript
// Get chat instance
const chat = GreenticWebChat.getInstance();

// Send message programmatically
chat.sendMessage('Hello from JS!');

// Minimize/maximize
chat.minimize();
chat.maximize();

// Clear conversation
chat.clear();

// End conversation
chat.end();

// Listen for events
chat.on('message', (event) => {
  console.log('New message:', event.text);
});

chat.on('conversationStarted', () => {
  console.log('Conversation started');
});
```

### REST API

Direct Line REST API endpoints:

```bash
# Start conversation
POST /webchat/v3/directline/conversations
Authorization: Bearer <token>

# Send message
POST /webchat/v3/directline/conversations/{conversationId}/activities
Content-Type: application/json

{
  "type": "message",
  "text": "Hello!"
}

# Get messages
GET /webchat/v3/directline/conversations/{conversationId}/activities
```

## Customization

### Custom CSS

```html
<style>
  .greentic-webchat {
    --primary-color: #0078D4;
    --background-color: #ffffff;
    --text-color: #333333;
    --border-radius: 8px;
    --font-family: 'Segoe UI', sans-serif;
  }

  .greentic-webchat .message-bubble {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .greentic-webchat .send-button {
    background-color: var(--primary-color);
  }
</style>
```

### Custom Avatar

```javascript
GreenticWebChat.init({
  // ... other config
  botAvatar: 'https://example.com/bot-avatar.png',
  userAvatar: 'https://example.com/user-avatar.png',
  showAvatars: true
});
```

### Custom Header

```javascript
GreenticWebChat.init({
  // ... other config
  header: {
    title: 'Support Chat',
    subtitle: 'We usually reply within minutes',
    showCloseButton: true
  }
});
```

## Multi-Language Support

```javascript
GreenticWebChat.init({
  // ... other config
  locale: 'es-ES',
  strings: {
    'placeholder': 'Escribe un mensaje...',
    'send': 'Enviar',
    'connecting': 'Conectando...',
    'reconnecting': 'Reconectando...'
  }
});
```

## Security

<Aside type="caution">
Always configure `allowed_origins` in production to prevent unauthorized embedding.
</Aside>

### Token Security

- Tokens are short-lived (1 hour default)
- Tokens are scoped to conversation
- Refresh tokens are not exposed to client

### CORS Configuration

```json
{
  "messaging-webchat": {
    "allowed_origins": [
      "https://www.example.com",
      "https://app.example.com"
    ]
  }
}
```

## Troubleshooting

### Widget Not Loading

1. Check console for JavaScript errors
2. Verify script URL is correct
3. Check CORS configuration

### Connection Failed

1. Verify Direct Line endpoint is accessible
2. Check WebSocket support
3. Review firewall settings

### Messages Not Sending

1. Check conversation is active
2. Verify token hasn't expired
3. Review browser console for errors

## Next Steps

- [Adaptive Cards](/greentic-docs/components/cards2pack/) - Create rich cards
- [Theming Guide](/greentic-docs/reference/webchat-theming/) - Advanced customization
- [Flows Guide](/greentic-docs/concepts/flows/) - Build conversation flows

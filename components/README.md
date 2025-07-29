# CustomAlert Component Documentation

## Overview

The `CustomAlert` component is a beautiful, customizable alert system that replaces React Native's default `Alert.alert()` with a design that matches the app's visual style. It provides a modern, accessible, and highly customizable alert experience.

## Features

- 🎨 **Beautiful Design**: Matches the app's design system with consistent colors and typography
- 🌟 **Multiple Types**: Success, error, warning, and info alerts with contextual icons
- 🔘 **Flexible Buttons**: Support for single or multiple buttons with different styles
- 📱 **Responsive**: Adapts to different screen sizes and orientations
- ♿ **Accessible**: Proper contrast ratios and touch targets
- 🌀 **Modern Effects**: Blur background overlay for a premium feel

## Components

### CustomAlert

The main alert component that displays the modal with title, message, and buttons.

### useCustomAlert Hook

A custom hook that manages the alert state and provides easy-to-use functions.

## Installation

The component uses `expo-blur` for the background effect. Make sure it's installed:

```bash
npx expo install expo-blur
```

## Basic Usage

### 1. Import the Hook

```typescript
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/CustomAlert';
```

### 2. Setup in Component

```typescript
export default function MyScreen() {
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  const handleShowAlert = () => {
    showAlert({
      title: 'Success!',
      message: 'Your action was completed successfully.',
      type: 'success'
    });
  };

  return (
    <View>
      {/* Your screen content */}
      <TouchableOpacity onPress={handleShowAlert}>
        <Text>Show Alert</Text>
      </TouchableOpacity>

      {/* Alert Component */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}
```

## Alert Types

### Success Alert
```typescript
showAlert({
  title: 'Success!',
  message: 'Your account has been created successfully.',
  type: 'success'
});
```

### Error Alert
```typescript
showAlert({
  title: 'Error',
  message: 'Something went wrong. Please try again.',
  type: 'error'
});
```

### Warning Alert
```typescript
showAlert({
  title: 'Warning',
  message: 'This action cannot be undone.',
  type: 'warning'
});
```

### Info Alert
```typescript
showAlert({
  title: 'Information',
  message: 'Here is some important information.',
  type: 'info'
});
```

## Custom Buttons

### Single Button (Default)
```typescript
showAlert({
  title: 'Simple Alert',
  message: 'This alert has a default OK button.',
  type: 'info'
});
```

### Multiple Buttons
```typescript
showAlert({
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  type: 'warning',
  buttons: [
    { 
      text: 'Cancel', 
      style: 'cancel' 
    },
    { 
      text: 'Confirm', 
      style: 'default',
      onPress: () => console.log('Confirmed!')
    }
  ]
});
```

### Destructive Action
```typescript
showAlert({
  title: 'Delete Item',
  message: 'This action cannot be undone.',
  type: 'warning',
  buttons: [
    { text: 'Cancel', style: 'cancel' },
    { 
      text: 'Delete', 
      style: 'destructive',
      onPress: handleDelete
    }
  ]
});
```

## API Reference

### showAlert Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | `string` | ✅ | The alert title |
| `message` | `string` | ✅ | The alert message |
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | ❌ | Alert type (default: 'info') |
| `buttons` | `AlertButton[]` | ❌ | Custom buttons array |

### AlertButton Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `text` | `string` | ✅ | Button text |
| `onPress` | `() => void` | ❌ | Button press handler |
| `style` | `'default' \| 'cancel' \| 'destructive'` | ❌ | Button style |

### Button Styles

- **`default`**: Primary blue button (app brand color)
- **`cancel`**: Light gray button with border
- **`destructive`**: Red button for dangerous actions

## Styling

The component uses the app's design tokens:

### Colors
- **Primary**: `#035AA6` (app brand color)
- **Success**: `#10B981` (green)
- **Error**: `#EF4444` (red)
- **Warning**: `#F59E0B` (yellow)
- **Info**: `#3B82F6` (blue)

### Typography
- **Title**: 20px, bold, `#111827`
- **Message**: 16px, regular, `#6B7280`
- **Button**: 16px, semibold

### Spacing
- **Padding**: 24px
- **Border Radius**: 20px
- **Button Gap**: 12px

## Accessibility

The component includes several accessibility features:

- **High Contrast**: All text meets WCAG contrast requirements
- **Touch Targets**: Buttons are at least 44px in height
- **Screen Reader**: Proper semantic structure
- **Keyboard Navigation**: Modal can be dismissed with back button

## Migration from React Native Alert

### Before (React Native Alert)
```typescript
Alert.alert(
  'Error',
  'Something went wrong',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: handleOK }
  ]
);
```

### After (CustomAlert)
```typescript
showAlert({
  title: 'Error',
  message: 'Something went wrong',
  type: 'error',
  buttons: [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK', onPress: handleOK }
  ]
});
```

## Best Practices

### 1. Use Appropriate Types
Choose the right alert type for the context:
- **Success**: Confirmations, completed actions
- **Error**: Failed operations, validation errors
- **Warning**: Destructive actions, important notices
- **Info**: General information, tips

### 2. Keep Messages Concise
- Use clear, actionable language
- Keep titles under 50 characters
- Keep messages under 150 characters

### 3. Button Guidelines
- Use no more than 3 buttons
- Place destructive actions on the right
- Use "Cancel" for dismissive actions

### 4. Consistent Styling
The component automatically uses the app's design tokens, so no additional styling is needed.

## Examples

### Form Validation Error
```typescript
showAlert({
  title: t('common.error'),
  message: t('auth.phoneRequired'),
  type: 'error'
});
```

### Successful Operation
```typescript
showAlert({
  title: t('common.success'),
  message: t('profile.profileUpdated'),
  type: 'success'
});
```

### Confirmation Dialog
```typescript
showAlert({
  title: t('profile.logout'),
  message: t('profile.logoutConfirmation'),
  type: 'warning',
  buttons: [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('profile.logout'),
      style: 'destructive',
      onPress: handleLogout
    }
  ]
});
```

## Troubleshooting

### Alert Not Showing
- Ensure `CustomAlert` component is rendered in your JSX
- Check that `alertState.visible` is being set to `true`
- Verify the component is not behind other elements (z-index)

### Blur Effect Not Working
- Make sure `expo-blur` is properly installed
- Check that the device/simulator supports blur effects
- On Android, blur effects may have limited support

### Buttons Not Working
- Ensure `onPress` handlers are properly defined
- Check that `hideAlert` is called after button actions
- Verify button text is not empty

## Contributing

When modifying the CustomAlert component:

1. Maintain consistency with the app's design system
2. Test on both iOS and Android
3. Ensure accessibility standards are met
4. Update this documentation for any API changes
5. Add appropriate TypeScript types for new features
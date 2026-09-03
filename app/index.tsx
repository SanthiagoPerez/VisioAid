import { Text, View } from 'react-native';

export default function IndexRoute() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text accessibilityRole="header" className="text-center text-4xl font-bold text-foreground">
        Bienvenido a VisioAid
      </Text>
    </View>
  );
}

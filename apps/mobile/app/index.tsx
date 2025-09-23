import { Button, Text, View } from 'react-native'

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Button title="Hello, world!" onPress={() => alert('Button pressed!')} />
    </View>
  )
}

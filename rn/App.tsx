import HomeScreen from "./HomeScreen";
import SongList from "./SongList";
import { createStackNavigator, createAppContainer } from "react-navigation";

const MainNavigator = createStackNavigator({
  Home: { screen: HomeScreen },
  Profile: { screen: SongList },
});

const App = createAppContainer(MainNavigator);

export default App;

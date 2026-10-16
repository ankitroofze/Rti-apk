import 'react-native-gesture-handler';
import './utils/Pushbackground'; // ✅ push: background/killed message handler (component ke bahar register hona zaroori)
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
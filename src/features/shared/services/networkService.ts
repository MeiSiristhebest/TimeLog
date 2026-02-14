import NetInfo from '@react-native-community/netinfo';

export async function checkNetworkOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    if (state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
  } catch {
    return false;
  }
}

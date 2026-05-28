import { ThemeProvider } from "./components/common/ThemeProvider";
import { AppRouter } from "./routes/AppRouter";

export const App = () => (
  <ThemeProvider>
    <AppRouter />
  </ThemeProvider>
);

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { motion } from 'motion/react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-muted-foreground" />
      ) : (
        <Sun size={20} className="text-amber-400" />
      )}
    </motion.button>
  );
}

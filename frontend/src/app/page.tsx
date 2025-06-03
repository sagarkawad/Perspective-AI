"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Navbar from "@/app/components/Navbar";
import AnalyzeButton from "@/app/components/Utils/AnalyzeButton";
import { useStore } from "@/zustand/states";
import { getOrCreateMachineId } from "@/app/utils/machineId";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

// Define proper TypeScript interfaces
interface TextItem {
  str: string;
  dir?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
}

const Home = () => {
  const [article_url, setArticleURL] = useState("");
  const [selectedType, setSelectedType] = useState("article");
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { file, setFile } = useStore();

  const { user } = useUser();
  const handleSubmit = useCallback(async () => {
    let entry;
    if (file) {
      entry = { type: "pdf", name: file.name };
    } else {
      if (!article_url.trim()) return;
      entry = { type: selectedType, url: article_url };
    }

    try {
      await fetch("http://localhost:8000/history/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: entry.type,
          url: entry.url,
          name: entry.name,
          machine_id: getOrCreateMachineId(),
          user_id: user?.id,
        }),
      });
    } catch (err) {
      console.error("Error saving history:", err);
    }

    if (file) {
      router.push(`/article?type=pdf`);
    } else {
      const encodedURL = encodeURIComponent(article_url);
      router.push(`/article?url=${encodedURL}&type=${selectedType}`);
    }
  }, [article_url, router, selectedType, file, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ 
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)",
        zIndex: -1,
      },
      "&::after": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)",
        backgroundSize: "40px 40px",
        opacity: 0.7,
        zIndex: -1,
      }
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(224, 234, 252, 0.9) 0%, rgba(207, 222, 243, 0.9) 100%)"
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 45, 0],
            x: [0, 20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: "absolute",
            top: "-25%",
            left: "-25%",
            right: "-25%",
            bottom: "-25%",
            background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.5) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [45, 0, 45],
            x: [0, -20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: "absolute",
            top: "-25%",
            left: "-25%",
            right: "-25%",
            bottom: "-25%",
            background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
      </motion.div>

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.3, 1],
            x: [0, Math.random() * 60 - 30, 0],
            y: [0, Math.random() * 60 - 30, 0],
            rotate: [0, 180, 0],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
          style={{
            position: "absolute",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: `radial-gradient(circle at center, rgba(${99 + i * 15}, ${102 + i * 10}, ${241 - i * 15}, 0.3) 0%, transparent 70%)`,
            top: `${30 + i * 8}%`,
            left: `${35 + i * 5}%`,
            zIndex: 0,
            filter: "blur(15px)",
          }}
        />
      ))}

      {/* Add tech-style grid overlay */}
      <motion.div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "linear-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.5,
          zIndex: 0,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <Navbar />
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          position: "relative",
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            py: { xs: 4, md: 8 }, 
            px: { xs: 2, sm: 3, md: 4 },
            textAlign: "center",
            position: "relative",
            zIndex: 1,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            margin: { xs: "10px", sm: "20px" },
            width: { xs: "calc(100% - 20px)", sm: "calc(100% - 40px)" },
            maxWidth: { xs: "100%", sm: "1200px" },
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "800px",
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: { xs: 3, md: 4 }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ width: "100%" }}
            >
              <Typography
                variant={isMobile ? "h3" : "h2"}
                fontWeight="500"
                gutterBottom
                sx={{
                  background: "linear-gradient(45deg, #4a5568, #2d3748)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                  px: { xs: 1, sm: 2 },
                  wordBreak: "break-word",
                }}
              >
                Discover Different Perspectives
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ width: "100%" }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  mb: { xs: 3, md: 4 },
                }}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  style={{
                    display: "none"
                  }}
                  id="file-input"
                />
                <Box
                  component="label"
                  htmlFor="file-input"
                  sx={{
                    display: "inline-block",
                    padding: { xs: "8px 16px", sm: "10px 20px" },
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    color: "#4a5568",
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    fontWeight: "500",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 1)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)"
                    }
                  }}
                >
                  Upload PDF
                </Box>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ width: "100%" }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  maxWidth: "600px",
                  mx: "auto",
                  mb: { xs: 3, md: 4 },
                  color: "#4a5568",
                  fontSize: { xs: "0.9rem", sm: "1.1rem" },
                  lineHeight: 1.6,
                  px: { xs: 1, sm: 2 }
                }}
              >
                Enter an article URL to analyze multiple viewpoints and engage in discussions.
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ width: "100%" }}
            >
              <Box
                sx={{
                  maxWidth: "600px",
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  mb: 4,
                  px: { xs: 1, sm: 2 }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    component="input"
                    type="text"
                    placeholder="Type a URL..."
                    required
                    value={article_url}
                    onChange={(e) => setArticleURL(e.target.value)}
                    sx={{
                      width: "100%",
                      padding: { xs: "10px 14px", sm: "12px 16px" },
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(8px)",
                      transition: "all 0.3s ease",
                      outline: "none",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      "&:focus": {
                        borderColor: "#4a5568",
                        boxShadow: "0 0 0 2px rgba(74, 85, 104, 0.2)",
                        backgroundColor: "rgba(255, 255, 255, 1)"
                      }
                    }}
                  />
                </Box>
                <FormControl sx={{ minWidth: { xs: "100%", sm: "120px" } }}>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                      "&:hover": {
                        borderColor: "#4a5568",
                        backgroundColor: "rgba(255, 255, 255, 1)"
                      },
                      height: "100%",
                      "& .MuiSelect-select": {
                        padding: { xs: "10px 14px", sm: "12px 16px" },
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        lineHeight: "1.5",
                        display: "flex",
                        alignItems: "center"
                      }
                    }}
                  >
                    <MenuItem value="article">Article</MenuItem>
                    <MenuItem value="video">Video</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              style={{ width: "100%" }}
            >
              <Box
                display="flex"
                justifyContent="center"
                mb={6}
                onClick={handleSubmit}
                sx={{ 
                  px: { xs: 1, sm: 2 },
                  width: "100%",
                  maxWidth: "600px",
                  mx: "auto"
                }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    boxShadow: "0 4px 20px rgba(79, 70, 229, 0.15)",
                    transition: "all 0.3s ease",
                    width: "100%"
                  }}
                >
                  <Box
                    sx={{
                      padding: { xs: "10px 24px", sm: "12px 32px" },
                      color: "white",
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      fontWeight: "500",
                      letterSpacing: "0.5px",
                      textTransform: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      "&:hover": {
                        background: "rgba(255, 255, 255, 0.1)",
                      }
                    }}
                  >
                    Analyze
                    <motion.span
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      →
                    </motion.span>
                  </Box>
                </motion.div>
              </Box>
            </motion.div>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  className = "" 
}) => {
  // Size mappings
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-3"
  };

  const sizeClass = sizeClasses[size];

  return (
    <div 
      className={`${sizeClass} border-t-transparent animate-spin rounded-full ${className}`}
      style={{ borderColor: 'currentColor transparent transparent transparent' }}
    ></div>
  );
};
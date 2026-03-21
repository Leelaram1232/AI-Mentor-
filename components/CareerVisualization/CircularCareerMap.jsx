'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Tooltip } from '@mui/material';
import { calculateCareerPositions, adjustForCollisions, getNodeColor } from '@/utils/careerPositioning';

export default function CircularCareerMap({ careerPaths, currentPosition }) {
    const [positions, setPositions] = useState([]);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

    useEffect(() => {
        // Update dimensions based on window size
        const updateDimensions = () => {
            const size = Math.min(window.innerWidth - 100, 800);
            setDimensions({ width: size, height: size });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        if (careerPaths.length > 0) {
            const centerX = dimensions.width / 2;
            const centerY = dimensions.height / 2;
            const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 80;

            const calculatedPositions = calculateCareerPositions(
                careerPaths,
                centerX,
                centerY,
                maxRadius
            );
            const adjustedPositions = adjustForCollisions(calculatedPositions);
            setPositions(adjustedPositions);
        }
    }, [careerPaths, dimensions]);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const centerSize = 100;

    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 2,
            }}
        >
            <svg
                width={dimensions.width}
                height={dimensions.height}
                style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--background)',
                }}
            >
                {/* Connection lines from center to nodes */}
                {positions.map((pos, index) => (
                    <motion.line
                        key={`line-${index}`}
                        x1={centerX}
                        y1={centerY}
                        x2={pos.x}
                        y2={pos.y}
                        stroke={hoveredNode === index ? getNodeColor(pos.relevance) : 'var(--border)'}
                        strokeWidth={hoveredNode === index ? 2 : 1}
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.5 }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                    />
                ))}

                {/* Center node (current position) */}
                <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={centerSize / 2}
                        fill="var(--primary)"
                        stroke="var(--primary-hover)"
                        strokeWidth="3"
                    />
                    <text
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="600"
                    >
                        Current
                    </text>
                    <text
                        x={centerX}
                        y={centerY + 16}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="12"
                    >
                        Position
                    </text>
                </motion.g>

                {/* Career path nodes */}
                {positions.map((pos, index) => (
                    <Tooltip
                        key={`node-${index}`}
                        title={
                            <Box sx={{ p: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{pos.title}</div>
                                <div style={{ fontSize: '0.875rem', marginBottom: 8 }}>{pos.description}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                    Relevance: {pos.relevance}% | Impact: {pos.impact}%
                                </div>
                            </Box>
                        }
                        arrow
                        placement="top"
                    >
                        <motion.g
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                            onMouseEnter={() => setHoveredNode(index)}
                            onMouseLeave={() => setHoveredNode(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <motion.circle
                                cx={pos.x}
                                cy={pos.y}
                                r={pos.size / 2}
                                fill={getNodeColor(pos.relevance)}
                                stroke={hoveredNode === index ? 'var(--foreground)' : 'transparent'}
                                strokeWidth="3"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                            />
                            <text
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#ffffff"
                                fontSize={pos.size > 80 ? '12' : '10'}
                                fontWeight="600"
                                pointerEvents="none"
                                style={{
                                    maxWidth: pos.size - 20,
                                }}
                            >
                                {pos.title.length > 15 ? pos.title.substring(0, 15) + '...' : pos.title}
                            </text>
                        </motion.g>
                    </Tooltip>
                ))}
            </svg>

            {/* Legend */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 2,
                    fontSize: 'var(--font-size-sm)',
                }}
            >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Legend</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span>Highly Relevant (80%+)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                    <span>Moderately Relevant (60-79%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span>Somewhat Relevant (40-59%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#64748b' }} />
                    <span>Less Relevant (&lt;40%)</span>
                </div>
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--secondary)' }}>
                    Size indicates impact/prestige
                </div>
            </Box>
        </Box>
    );
}

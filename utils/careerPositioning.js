/**
 * Calculate positions for career nodes in a circular layout
 * @param {Array} careerPaths - Array of career path objects with relevance and impact scores
 * @param {number} centerX - X coordinate of center
 * @param {number} centerY - Y coordinate of center
 * @param {number} maxRadius - Maximum radius from center
 * @returns {Array} Career paths with calculated positions and sizes
 */
export function calculateCareerPositions(careerPaths, centerX, centerY, maxRadius = 300) {
    const minNodeSize = 60;
    const maxNodeSize = 120;

    return careerPaths.map((path, index) => {
        // Calculate distance from center based on relevance (100 = close, 0 = far)
        const relevanceRatio = path.relevance / 100;
        const distance = maxRadius * (1 - relevanceRatio * 0.7); // Keep nodes within 30-100% of maxRadius

        // Calculate size based on impact (100 = large, 0 = small)
        const impactRatio = path.impact / 100;
        const size = minNodeSize + (maxNodeSize - minNodeSize) * impactRatio;

        // Distribute nodes in a circle
        const angleStep = (2 * Math.PI) / careerPaths.length;
        const angle = index * angleStep;

        // Add some randomness to avoid perfect circle (more organic)
        const randomOffset = (Math.random() - 0.5) * 30;
        const adjustedDistance = distance + randomOffset;

        const x = centerX + adjustedDistance * Math.cos(angle);
        const y = centerY + adjustedDistance * Math.sin(angle);

        return {
            ...path,
            x,
            y,
            size,
            angle: (angle * 180) / Math.PI, // Convert to degrees for debugging
        };
    });
}

/**
 * Check if two nodes overlap
 */
function nodesOverlap(node1, node2, padding = 20) {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (node1.size + node2.size) / 2 + padding;

    return distance < minDistance;
}

/**
 * Adjust positions to prevent overlapping
 */
export function adjustForCollisions(positions, iterations = 50) {
    const adjusted = [...positions];

    for (let iter = 0; iter < iterations; iter++) {
        let hasCollision = false;

        for (let i = 0; i < adjusted.length; i++) {
            for (let j = i + 1; j < adjusted.length; j++) {
                if (nodesOverlap(adjusted[i], adjusted[j])) {
                    hasCollision = true;

                    // Push nodes apart
                    const dx = adjusted[j].x - adjusted[i].x;
                    const dy = adjusted[j].y - adjusted[i].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance === 0) continue;

                    const pushDistance = ((adjusted[i].size + adjusted[j].size) / 2 + 20 - distance) / 2;
                    const pushX = (dx / distance) * pushDistance;
                    const pushY = (dy / distance) * pushDistance;

                    adjusted[i].x -= pushX;
                    adjusted[i].y -= pushY;
                    adjusted[j].x += pushX;
                    adjusted[j].y += pushY;
                }
            }
        }

        if (!hasCollision) break;
    }

    return adjusted;
}

/**
 * Get color based on relevance score
 */
export function getNodeColor(relevance) {
    if (relevance >= 80) return '#10b981'; // Green - highly relevant
    if (relevance >= 60) return '#3b82f6'; // Blue - moderately relevant
    if (relevance >= 40) return '#f59e0b'; // Orange - somewhat relevant
    return '#64748b'; // Gray - less relevant
}

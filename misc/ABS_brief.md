# Project Summary

## Clustering Regions into Segments

This study employs a clustering algorithm to partition a given region into 'k' distinct segments based on two essential parameters:

- **VH (Vertical Horizontal):** A radar remote sensing parameter used for land cover analysis.
- **NDVI (Normalized Difference Vegetation Index):** A common vegetation index that measures vegetation health based on remote sensing data.

Subsequently, we apply the Fast Fourier Transform (FFT) to the averaged VH and NDVI data to identify periodic patterns, often corresponding to the growth cycles of paddy fields. This analysis quantifies the extent of paddy cultivation by calculating the area of these clusters relative to the total area.

## Assessing Water Quality

To evaluate water quality, we utilize two key indices:

- **NDWI (Normalized Difference Water Index):** This index focuses on the presence of water bodies, essential for water quality and aquatic ecosystems monitoring.
- **NDCI (Normalized Difference Chlorophyll Index):** Used to estimate chlorophyll content in plants, reflecting vegetation health.

## Evaluating Crop Quality

Our assessment of crop quality hinges on two primary parameters:

- **Water Quality**
- **Nighttime Ground Temperature:** Monitoring nighttime ground temperatures helps identify regions with optimal conditions for crop growth. Crops thrive in specific temperature ranges.


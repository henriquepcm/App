import lodashClamp from 'lodash/clamp';
import React, {useState} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import ImageWithSizeCalculation from './ImageWithSizeCalculation';
import styles from '../styles/styles';
import * as StyleUtils from '../styles/StyleUtils';
import withWindowDimensions, {windowDimensionsPropTypes} from './withWindowDimensions';

const propTypes = {
    /** Source URL for the preview image */
    previewSourceURL: PropTypes.string.isRequired,

    /** Any additional styles to apply */
    // eslint-disable-next-line react/forbid-prop-types
    style: PropTypes.any,

    /** Whether the image requires an authToken */
    isAuthTokenRequired: PropTypes.bool.isRequired,

    /** Width of the thumbnail image */
    imageWidth: PropTypes.number,

    /** Height of the thumbnail image */
    imageHeight: PropTypes.number,

    ...windowDimensionsPropTypes,
};

const defaultProps = {
    style: {},
    imageWidth: 200,
    imageHeight: 200,
};

/**
 * Compute the thumbnails width and height given original image dimensions.
 *
 * @param {Number} width - Width of the original image.
 * @param {Number} height - Height of the original image.
 * @returns {Object} - Object containing thumbnails width and height.
 */

function calculateThumbnailImageSize(width, height, windowHeight) {
    if (!width || !height) {
        return {};
    }

    // Width of the thumbnail works better as a constant than it does
    // a percentage of the screen width since it is relative to each screen
    // Note: Clamp minimum width 40px to support touch device
    let thumbnailScreenWidth = lodashClamp(width, 40, 250);
    const imageHeight = height / (width / thumbnailScreenWidth);
    let thumbnailScreenHeight = lodashClamp(imageHeight, 40, windowHeight * 0.4);
    const aspectRatio = height / width;

    // If thumbnail height is greater than its width, then the image is portrait otherwise landscape.
    // For portrait images, we need to adjust the width of the image to keep the aspect ratio and vice-versa.
    if (thumbnailScreenHeight > thumbnailScreenWidth) {
        thumbnailScreenWidth = Math.round(thumbnailScreenHeight * (1 / aspectRatio));
    } else {
        thumbnailScreenHeight = Math.round(thumbnailScreenWidth * aspectRatio);
    }
    return {thumbnailWidth: Math.max(40, thumbnailScreenWidth), thumbnailHeight: Math.max(40, thumbnailScreenHeight)};
}

function ThumbnailImage(props) {
    const [imageWidth, setImageWidth] = useState(200);
    const [imageHeight, setImageHeight] = useState(200);

    /**
     * Update the state with the computed thumbnail sizes.
     *
     * @param {{ width: number, height: number }} Params - width and height of the original image.
     */

    function updateImageSize({width, height}) {
        const {thumbnailWidth, thumbnailHeight} = calculateThumbnailImageSize(width, height, props.windowHeight);
        setImageWidth(thumbnailWidth);
        setImageHeight(thumbnailHeight);
    }
    return (
        <View style={[props.style, styles.overflowHidden]}>
            <View style={[StyleUtils.getWidthAndHeightStyle(imageWidth, imageHeight), styles.alignItemsCenter, styles.justifyContentCenter]}>
                <ImageWithSizeCalculation
                    url={props.previewSourceURL}
                    onMeasure={updateImageSize}
                    isAuthTokenRequired={props.isAuthTokenRequired}
                />
            </View>
        </View>
    );
}

ThumbnailImage.propTypes = propTypes;
ThumbnailImage.defaultProps = defaultProps;
export default withWindowDimensions(ThumbnailImage);

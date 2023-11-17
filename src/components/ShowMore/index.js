import PropTypes from 'prop-types';
import React from 'react';
import {Text, View} from 'react-native';
import _ from 'underscore';
import Button from '@components/Button';
import * as Expensicons from '@components/Icon/Expensicons';
import useLocalize from '@hooks/useLocalize';
import * as NumberFormatUtils from '@libs/NumberFormatUtils';
import stylePropTypes from '@styles/stylePropTypes';
import styles from '@styles/styles';
import themeColors from '@styles/themes/default';

const propTypes = {
    /** Additional styles for container */
    containerStyle: stylePropTypes,

    /** A number of current showed items */
    currentCount: PropTypes.number,

    /** A number of total items */
    totalCount: PropTypes.number,

    /** A handler fires when button has been pressed */
    onPress: PropTypes.func.isRequired,
};

const defaultProps = {
    containerStyle: {},
    currentCount: undefined,
    totalCount: undefined,
};

function ShowMore({containerStyle, currentCount, totalCount, onPress}) {
    const {translate, preferredLocale} = useLocalize();

    const shouldShowCounter = _.isNumber(currentCount) && _.isNumber(totalCount);

    return (
        <View style={[styles.alignItemsCenter, containerStyle]}>
            {shouldShowCounter && (
                <Text style={[styles.mb2, styles.textLabelSupporting]}>
                    {`${translate('common.showing')} `}
                    <Text style={styles.textStrong}>{currentCount}</Text>
                    {` ${translate('common.of')} `}
                    <Text style={styles.textStrong}>{NumberFormatUtils.format(preferredLocale, totalCount)}</Text>
                </Text>
            )}
            <View style={[styles.w100, styles.flexRow, styles.justifyContentBetween, styles.alignItemsCenter]}>
                <View style={[styles.shortTermsHorizontalRule, styles.flex1, styles.mr0]} />
                <Button
                    style={styles.mh0}
                    small
                    shouldShowRightIcon
                    iconFill={themeColors.icon}
                    iconRight={Expensicons.DownArrow}
                    text={translate('common.showMore')}
                    accessibilityLabel={translate('common.showMore')}
                    onPress={onPress}
                />
                <View style={[styles.shortTermsHorizontalRule, styles.flex1, styles.ml0]} />
            </View>
        </View>
    );
}

ShowMore.displayName = 'ShowMore';
ShowMore.propTypes = propTypes;
ShowMore.defaultProps = defaultProps;

export default ShowMore;

import lodashIsEmpty from 'lodash/isEmpty';
import React, {useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import BlockingView from '@components/BlockingViews/BlockingView';
import Button from '@components/Button';
import CategoryPicker from '@components/CategoryPicker';
import FixedFooter from '@components/FixedFooter';
import * as Illustrations from '@components/Icon/Illustrations';
import type {ListItem} from '@components/SelectionList/types';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import * as ReportUtils from '@libs/ReportUtils';
import * as TransactionUtils from '@libs/TransactionUtils';
import variables from '@styles/variables';
import * as IOU from '@userActions/IOU';
import * as PolicyActions from '@userActions/Policy';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type {Policy, PolicyCategories, PolicyTagList, ReportActions, Session, Transaction} from '@src/types/onyx';
import StepScreenWrapper from './StepScreenWrapper';
import type {WithFullTransactionOrNotFoundProps} from './withFullTransactionOrNotFound';
import withFullTransactionOrNotFound from './withFullTransactionOrNotFound';
import type {WithWritableReportOrNotFoundProps} from './withWritableReportOrNotFound';
import withWritableReportOrNotFound from './withWritableReportOrNotFound';

type IOURequestStepCategoryOnyxProps = {
    /** The draft transaction that holds data to be persisted on the current transaction */
    splitDraftTransaction: OnyxEntry<Transaction>;

    /** The policy of the report */
    policy: OnyxEntry<Policy>;

    /** The draft policy of the report */
    policyDraft: OnyxEntry<Policy>;

    /** Collection of categories attached to a policy */
    policyCategories: OnyxEntry<PolicyCategories>;

    /** Collection of draft categories attached to a policy */
    policyCategoriesDraft: OnyxEntry<PolicyCategories>;

    /** Collection of tags attached to a policy */
    policyTags: OnyxEntry<PolicyTagList>;

    /** The actions from the parent report */
    reportActions: OnyxEntry<ReportActions>;

    /** Session info for the currently logged in user. */
    session: OnyxEntry<Session>;
};

type IOURequestStepCategoryProps = IOURequestStepCategoryOnyxProps &
    WithWritableReportOrNotFoundProps<typeof SCREENS.MONEY_REQUEST.STEP_CATEGORY> &
    WithFullTransactionOrNotFoundProps<typeof SCREENS.MONEY_REQUEST.STEP_CATEGORY>;

function IOURequestStepCategory({
    report: reportReal,
    reportDraft,
    route: {
        params: {transactionID, backTo, action, iouType, reportActionID},
    },
    transaction,
    splitDraftTransaction,
    policy: policyReal,
    policyDraft,
    policyTags,
    policyCategories: policyCategoriesReal,
    policyCategoriesDraft,
    reportActions,
    session,
}: IOURequestStepCategoryProps) {
    const report = reportReal ?? reportDraft;
    const policy = policyReal ?? policyDraft;
    const policyCategories = policyCategoriesReal ?? policyCategoriesDraft;
    const styles = useThemeStyles();
    const theme = useTheme();
    const {translate} = useLocalize();
    const isEditing = action === CONST.IOU.ACTION.EDIT;
    const isEditingSplitBill = isEditing && iouType === CONST.IOU.TYPE.SPLIT;
    const transactionCategory = ReportUtils.getTransactionDetails(isEditingSplitBill && !lodashIsEmpty(splitDraftTransaction) ? splitDraftTransaction : transaction)?.category;

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const reportAction = reportActions?.[report?.parentReportActionID || reportActionID] ?? null;

    // The transactionCategory can be an empty string, so to maintain the logic we'd like to keep it in this shape until utils refactor
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const shouldShowCategory = ReportUtils.isReportInGroupPolicy(report, policy) && (!!transactionCategory || OptionsListUtils.hasEnabledOptions(Object.values(policyCategories ?? {})));

    const isSplitBill = iouType === CONST.IOU.TYPE.SPLIT;
    const canEditSplitBill = isSplitBill && reportAction && session?.accountID === reportAction.actorAccountID && TransactionUtils.areRequiredFieldsEmpty(transaction);
    // eslint-disable-next-line rulesdir/no-negated-variables
    const shouldShowNotFoundPage = isEditing && (isSplitBill ? !canEditSplitBill : !ReportUtils.canEditMoneyRequest(reportAction));

    const fetchData = () => {
        if (policy && policyCategories) {
            return;
        }

        PolicyActions.openDraftWorkspaceRequest(report?.policyID ?? '');
    };
    const {isOffline} = useNetwork({onReconnect: fetchData});
    const isLoading = !isOffline && policyCategories === undefined;
    const shouldShowEmptyState = !isLoading && !shouldShowCategory;

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const navigateBack = () => {
        Navigation.goBack(backTo);
    };

    const updateCategory = (category: ListItem) => {
        const categorySearchText = category.searchText ?? '';
        const isSelectedCategory = categorySearchText === transactionCategory;
        const updatedCategory = isSelectedCategory ? '' : categorySearchText;

        if (transaction) {
            // In the split flow, when editing we use SPLIT_TRANSACTION_DRAFT to save draft value
            if (isEditingSplitBill) {
                IOU.setDraftSplitTransaction(transaction.transactionID, {category: updatedCategory});
                navigateBack();
                return;
            }

            if (isEditing && report) {
                IOU.updateMoneyRequestCategory(transaction.transactionID, report.reportID, updatedCategory, policy, policyTags, policyCategories);
                navigateBack();
                return;
            }
        }

        IOU.setMoneyRequestCategory(transactionID, updatedCategory);

        if (action === CONST.IOU.ACTION.CATEGORIZE) {
            Navigation.navigate(ROUTES.MONEY_REQUEST_STEP_CONFIRMATION.getRoute(action, iouType, transactionID, report?.reportID ?? ''));
            return;
        }

        navigateBack();
    };

    return (
        <StepScreenWrapper
            headerTitle={translate('common.category')}
            onBackButtonPress={navigateBack}
            shouldShowWrapper
            shouldShowNotFoundPage={shouldShowNotFoundPage}
            testID={IOURequestStepCategory.displayName}
            includeSafeAreaPaddingBottom={false}
        >
            {isLoading && (
                <ActivityIndicator
                    size={CONST.ACTIVITY_INDICATOR_SIZE.LARGE}
                    style={[styles.flex1]}
                    color={theme.spinner}
                />
            )}
            {shouldShowEmptyState && (
                <View style={[styles.flex1]}>
                    <BlockingView
                        icon={Illustrations.EmptyStateExpenses}
                        iconWidth={variables.modalTopIconWidth}
                        iconHeight={variables.modalTopIconHeight}
                        title={translate('workspace.categories.emptyCategories.title')}
                        subtitle={translate('workspace.categories.emptyCategories.subtitle')}
                    />
                    <FixedFooter style={[styles.mtAuto, styles.pt5]}>
                        <Button
                            large
                            success
                            style={[styles.w100]}
                            onPress={() =>
                                Navigation.navigate(
                                    ROUTES.SETTINGS_CATEGORIES_ROOT.getRoute(
                                        policy?.id ?? '',
                                        ROUTES.MONEY_REQUEST_STEP_CATEGORY.getRoute(action, iouType, transactionID, report?.reportID ?? '', backTo, reportActionID),
                                    ),
                                )
                            }
                            text={translate('workspace.categories.editCategories')}
                            pressOnEnter
                        />
                    </FixedFooter>
                </View>
            )}
            {!shouldShowEmptyState && !isLoading && (
                <>
                    <Text style={[styles.ph5, styles.pv3]}>{translate('iou.categorySelection')}</Text>
                    <CategoryPicker
                        selectedCategory={transactionCategory}
                        policyID={report?.policyID ?? ''}
                        onSubmit={updateCategory}
                    />
                </>
            )}
        </StepScreenWrapper>
    );
}

IOURequestStepCategory.displayName = 'IOURequestStepCategory';

const IOURequestStepCategoryWithOnyx = withOnyx<IOURequestStepCategoryProps, IOURequestStepCategoryOnyxProps>({
    splitDraftTransaction: {
        key: ({route}) => {
            const transactionID = route?.params.transactionID ?? 0;
            return `${ONYXKEYS.COLLECTION.SPLIT_TRANSACTION_DRAFT}${transactionID}`;
        },
    },
    policy: {
        key: ({report}) => `${ONYXKEYS.COLLECTION.POLICY}${report ? report.policyID : '0'}`,
    },
    policyDraft: {
        key: ({reportDraft}) => `${ONYXKEYS.COLLECTION.POLICY_DRAFTS}${reportDraft ? reportDraft.policyID : '0'}`,
    },
    policyCategories: {
        key: ({report}) => `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${report ? report.policyID : '0'}`,
    },
    policyCategoriesDraft: {
        key: ({reportDraft}) => `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES_DRAFT}${reportDraft ? reportDraft.policyID : '0'}`,
    },
    policyTags: {
        key: ({report}) => `${ONYXKEYS.COLLECTION.POLICY_TAGS}${report ? report.policyID : '0'}`,
    },
    reportActions: {
        key: ({
            report,
            route: {
                params: {action, iouType},
            },
        }) => {
            let reportID = '0';
            if (action === CONST.IOU.ACTION.EDIT && report) {
                if (iouType === CONST.IOU.TYPE.SPLIT) {
                    reportID = report.reportID;
                } else if (report.parentReportID) {
                    reportID = report.parentReportID;
                }
            }
            return `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${reportID}`;
        },
        canEvict: false,
    },
    session: {
        key: ONYXKEYS.SESSION,
    },
})(IOURequestStepCategory);
/* eslint-disable rulesdir/no-negated-variables */
const IOURequestStepCategoryWithFullTransactionOrNotFound = withFullTransactionOrNotFound(IOURequestStepCategoryWithOnyx);
/* eslint-disable rulesdir/no-negated-variables */
const IOURequestStepCategoryWithWritableReportOrNotFound = withWritableReportOrNotFound(IOURequestStepCategoryWithFullTransactionOrNotFound);
export default IOURequestStepCategoryWithWritableReportOrNotFound;

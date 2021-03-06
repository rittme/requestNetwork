import 'mocha';

import addressBasedManager from '../../../src/extensions/payment-network/address-based';

import { ExtensionTypes } from '@requestnetwork/types';

import Utils from '@requestnetwork/utils';

import { expect } from 'chai';

import * as DataAddPaymentAddress from '../../utils/payment-network/address-based-add-payment-address-data-generator';
import * as DataCreate from '../../utils/payment-network/address-based-data-generator';
import * as TestData from '../../utils/test-data-generator';

const isValidAddressMock = (valid = true): (() => boolean) => (): boolean => valid;

const PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED = 'do-not-use!-pn-test-address-based' as ExtensionTypes.ID;

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/address-based', () => {
  describe('createCreationAction', () => {
    it('can createCreationAction with payment and refund', () => {
      expect(
        addressBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED, {
          paymentAddress: DataCreate.paymentAddress,
          refundAddress: DataCreate.refundAddress,
        }),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationWithPaymentAndRefund);
    });

    it('can createCreationAction with only paymentAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          addressBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED, {
            paymentAddress: DataCreate.paymentAddress,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationOnlyPayment);
    });
    it('can createCreationAction with only refundAddress', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          addressBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED, {
            refundAddress: DataCreate.refundAddress,
          }),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationOnlyRefund);
    });
    it('can createCreationAction with nothing', () => {
      // deep copy to remove the undefined properties to comply deep.equal()
      expect(
        Utils.deepCopy(
          addressBasedManager.createCreationAction(PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED, {}),
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataCreate.actionCreationEmpty);
    });
  });

  describe('createAddPaymentAddressAction', () => {
    it('can createAddPaymentAddressAction', () => {
      expect(
        addressBasedManager.createAddPaymentAddressAction(
          PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED,
          {
            paymentAddress: DataAddPaymentAddress.paymentAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataAddPaymentAddress.actionAddPaymentAddress);
    });
  });

  describe('createAddRefundAddressAction', () => {
    it('can createAddRefundAddressAction', () => {
      expect(
        addressBasedManager.createAddRefundAddressAction(
          PAYMENT_NETWORK_TEST_GENERIC_ADDRESS_BASED,
          {
            refundAddress: DataAddPaymentAddress.refundAddress,
          },
        ),
        'extensionsdata is wrong',
      ).to.deep.equal(DataAddPaymentAddress.actionAddRefundAddress);
    });
  });

  describe('applyActionToExtension', () => {
    describe('applyActionToExtension/unknown action', () => {
      it('cannot applyActionToExtensions of unknown action', () => {
        const unknownAction = Utils.deepCopy(DataAddPaymentAddress.actionAddPaymentAddress);
        unknownAction.action = 'unknown action';
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            unknownAction,
            DataCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('Unknown action: unknown action');
      });
    });

    describe('applyActionToExtension/create', () => {
      it('can applyActionToExtensions of creation', () => {
        expect(
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateNoExtensions.extensions,
            DataCreate.actionCreationWithPaymentAndRefund,
            DataCreate.requestStateNoExtensions,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataCreate.extensionStateWithPaymentAndRefund);
      });

      it('cannot applyActionToExtensions of creation with a previous state', () => {
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataCreate.actionCreationWithPaymentAndRefund,
            DataCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.otherIdRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw('This extension has already been created');
      });
    });

    describe('applyActionToExtension/addPaymentAddress', () => {
      it('can applyActionToExtensions of addPaymentAddress', () => {
        expect(
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            DataCreate.requestStateCreatedEmpty,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataAddPaymentAddress.extensionStateWithPaymentAfterCreation);
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a previous state', () => {
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateNoExtensions.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            DataCreate.requestStateNoExtensions,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          `The extension should be created before receiving any other action`,
        );
      });
      it('cannot applyActionToExtensions of addPaymentAddress without a payee', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        previousState.payee = undefined;
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress signed by someone else than the payee', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payee`);
      });
      it('cannot applyActionToExtensions of addPaymentAddress with payment address already given', () => {
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataAddPaymentAddress.actionAddPaymentAddress,
            DataCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Payment address already given`);
      });
    });

    describe('applyActionToExtension/addRefundAddress', () => {
      it('can applyActionToExtensions of addRefundAddress', () => {
        expect(
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedEmpty.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            DataCreate.requestStateCreatedEmpty,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          ),
          'new extension state wrong',
        ).to.deep.equal(DataAddPaymentAddress.extensionStateWithRefundAfterCreation);
      });
      it('cannot applyActionToExtensions of addRefundAddress without a previous state', () => {
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateNoExtensions.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            DataCreate.requestStateNoExtensions,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(
          `The extension should be created before receiving any other action`,
        );
      });
      it('cannot applyActionToExtensions of addRefundAddress without a payer', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        previousState.payer = undefined;
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The request must have a payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress signed by someone else than the payer', () => {
        const previousState = Utils.deepCopy(DataCreate.requestStateCreatedEmpty);
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            previousState.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            previousState,
            TestData.payeeRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`The signer must be the payer`);
      });
      it('cannot applyActionToExtensions of addRefundAddress with payment address already given', () => {
        expect(() => {
          addressBasedManager.applyActionToExtension(
            isValidAddressMock(),
            DataCreate.requestStateCreatedWithPaymentAndRefund.extensions,
            DataAddPaymentAddress.actionAddRefundAddress,
            DataCreate.requestStateCreatedWithPaymentAndRefund,
            TestData.payerRaw.identity,
            TestData.arbitraryTimestamp,
          );
        }, 'must throw').to.throw(`Refund address already given`);
      });
    });
  });
});

import stripePo from '../../support/stripe.po';
import organizationPageObject from '../../support/organization.po';

function signIn() {
  const organization = organizationPageObject.useDefaultOrganization();
  cy.signIn(`/dashboard/${organization}/settings/subscription`);
}

describe(`Create Subscription`, () => {
  function navigateToSubscription() {
    cy.contains('Subscription').click();
  }

  describe('Using the UI', () => {
    describe('The session should be created successfully', () => {
      it('should redirect to the success page', () => {
        signIn();

        organizationPageObject.createOrganization(`Stripe ${Date.now()}`);

        navigateToSubscription();

        stripePo.selectPlan(0);
        stripePo.$getStripeCheckoutIframe().should('exist');
        stripePo.$fillForm();
        stripePo.$cardForm().submit();

        cy.cyGet('payment-return-success').should('exist');

        // Wait for the webhook to be called
        cy.wait(3000);

        cy.cyGet('checkout-success-back-button').click();
        navigateToSubscription();

        stripePo.verifyCreateSubscriptionElements();
        stripePo.$manageBillingButton().should('exist');
        stripePo.$assertStatus('active');
      });
    });
  });
});

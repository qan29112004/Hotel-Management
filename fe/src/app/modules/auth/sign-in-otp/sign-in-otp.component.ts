import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import {  FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { SharedModule } from 'app/shared/shared.module';
import { TranslocoService } from '@ngneat/transloco';
import { AuthUtils } from 'app/core/auth/auth.utils';

@Component({
  selector: 'app-sign-in-otp',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
  ],
  templateUrl: './sign-in-otp.component.html',
  styles: ``
})
export class SignInOtpComponent implements OnInit {
  @ViewChild('signInNgForm') signInNgForm: NgForm;

  alert: { type: FuseAlertType; message: string } = {
    type: 'success',
    message: '',
  };
  signInOtpForm: UntypedFormGroup;
  showAlert: boolean = false;


  /**
   * Constructor
   */
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _authService: AuthService,
    private _formBuilder: UntypedFormBuilder,
    private _router: Router,
    private _translocoService: TranslocoService
  ) { }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the form
    this.signInOtpForm = this._formBuilder.group({
      email: ['', [Validators.required, AuthUtils.emailValidator]]
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Sign in
   */
  signIn(): void {
    // Return if the form is invalid
    if (this.signInOtpForm.invalid) {
      return;
    }

    // Disable the form
    this.signInOtpForm.disable();

    // Hide the alert
    this.showAlert = false;

    // Sign in
    this._authService.signIn(this.signInOtpForm.value).subscribe(
      () => {
        // Set the redirect url.
        const redirectURL =
          this._activatedRoute.snapshot.queryParamMap.get(
            'redirectURL'
          ) || '/signed-in-redirect';

        // Navigate to the redirect url
        this._router.navigateByUrl(redirectURL);
      },
      (response) => {
        console.log(response);
        // Re-enable the form
        this.signInOtpForm.enable();

        // Reset the form
        // this.signInNgForm.resetForm();

        // Set the alert
        this.alert = {
          type: 'error',
          message: this._translocoService.translate('sign_in_otp.wrong_email'),
        };

        // Show the alert
        this.showAlert = true;
      }
    );
  }
}

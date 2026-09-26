# AGSI Facility Source Validation — v3.5.1.39

Official source checked: GIE AGSI API User Manual / Technical Documentation v007.

Validated semantics:

- EIC listing endpoint: `/api/about?show=listing`
- operator fields include `name`, `short_name`, `type`, `eic`, `country`, `url`
- operator `facilities` is an array of underlying facilities
- facility fields include `name`, `type`, `eic`, `country`, `company`, `url`
- facility datasets are identified by the combination of operator EIC and facility EIC
- an individual physical facility may be operated by multiple companies/shares; therefore displayed facility datasets are not summed into the authoritative EU total

Parser compatibility fixtures cover:

1. v007 documented direct array
2. `{data:[...]}` wrapper
3. `{result:[...]}` wrapper
4. legacy hierarchical listing
5. empty wrapped listing diagnostic

Result: **5/5 PASS**.

Authenticated live facility-list acceptance remains a physical-device test because the user's private AGSI API key was not supplied to the build environment.

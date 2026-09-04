// Value selection only; arguments are evaluated before these helpers run.
(function () {
  function $if(condition) {
    return {
      use(whenTrue) {
        return {
          otherwise(whenFalse) {
            return condition ? whenTrue : whenFalse;
          }
        };
      }
    };
  }

  function $switch(value) {
    let matched = false;
    let result;

    const chain = {
      case(expected, mappedValue) {
        if (!matched) {
          const values = Array.isArray(expected) ? expected : [expected];

          if (values.includes(value)) {
            matched = true;
            result = mappedValue;
          }
        }

        return chain;
      },

      default(defaultValue) {
        return matched ? result : defaultValue;
      }
    };

    return chain;
  }

  const ForgeValueHelpers = { $if, $switch };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForgeValueHelpers;
  }

  if (typeof window !== 'undefined') {
    window.ForgeValueHelpers = ForgeValueHelpers;
    window.$if = $if;
    window.$switch = $switch;
  }
})();
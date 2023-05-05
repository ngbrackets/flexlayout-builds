/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { mergeAlias } from '../add-alias';
import { MediaChange } from '../media-change';
import { sortDescendingPriority } from '../utils/sort';
import { LAYOUT_CONFIG } from '../tokens/library-config';
import * as i0 from "@angular/core";
import * as i1 from "../breakpoints/break-point-registry";
import * as i2 from "../match-media/match-media";
/**
 * Class
 */
class MediaTrigger {
    constructor(breakpoints, matchMedia, layoutConfig, _platformId, _document) {
        this.breakpoints = breakpoints;
        this.matchMedia = matchMedia;
        this.layoutConfig = layoutConfig;
        this._platformId = _platformId;
        this._document = _document;
        this.hasCachedRegistryMatches = false;
        this.originalActivations = [];
        this.originalRegistry = new Map();
    }
    /**
     * Manually activate range of breakpoints
     * @param list array of mediaQuery or alias strings
     */
    activate(list) {
        list = list.map(it => it.trim()); // trim queries
        this.saveActivations();
        this.deactivateAll();
        this.setActivations(list);
        this.prepareAutoRestore();
    }
    /**
     * Restore original, 'real' breakpoints and emit events
     * to trigger stream notification
     */
    restore() {
        if (this.hasCachedRegistryMatches) {
            const extractQuery = (change) => change.mediaQuery;
            const list = this.originalActivations.map(extractQuery);
            try {
                this.deactivateAll();
                this.restoreRegistryMatches();
                this.setActivations(list);
            }
            finally {
                this.originalActivations = [];
                if (this.resizeSubscription) {
                    this.resizeSubscription.unsubscribe();
                }
            }
        }
    }
    // ************************************************
    // Internal Methods
    // ************************************************
    /**
     * Whenever window resizes, immediately auto-restore original
     * activations (if we are simulating activations)
     */
    prepareAutoRestore() {
        const isBrowser = isPlatformBrowser(this._platformId) && this._document;
        const enableAutoRestore = isBrowser && this.layoutConfig.mediaTriggerAutoRestore;
        if (enableAutoRestore) {
            const resize$ = fromEvent(window, 'resize').pipe(take(1));
            this.resizeSubscription = resize$.subscribe(this.restore.bind(this));
        }
    }
    /**
     * Notify all matchMedia subscribers of de-activations
     *
     * Note: we must force 'matches' updates for
     *       future matchMedia::activation lookups
     */
    deactivateAll() {
        const list = this.currentActivations;
        this.forceRegistryMatches(list, false);
        this.simulateMediaChanges(list, false);
    }
    /**
     * Cache current activations as sorted, prioritized list of MediaChanges
     */
    saveActivations() {
        if (!this.hasCachedRegistryMatches) {
            const toMediaChange = (query) => new MediaChange(true, query);
            const mergeMQAlias = (change) => {
                const bp = this.breakpoints.findByQuery(change.mediaQuery);
                return mergeAlias(change, bp);
            };
            this.originalActivations = this.currentActivations
                .map(toMediaChange)
                .map(mergeMQAlias)
                .sort(sortDescendingPriority);
            this.cacheRegistryMatches();
        }
    }
    /**
     * Force set manual activations for specified mediaQuery list
     */
    setActivations(list) {
        if (!!this.originalRegistry) {
            this.forceRegistryMatches(list, true);
        }
        this.simulateMediaChanges(list);
    }
    /**
     * For specified mediaQuery list manually simulate activations or deactivations
     */
    simulateMediaChanges(queries, matches = true) {
        const toMediaQuery = (query) => {
            const locator = this.breakpoints;
            const bp = locator.findByAlias(query) || locator.findByQuery(query);
            return bp ? bp.mediaQuery : query;
        };
        const emitChangeEvent = (query) => this.emitChangeEvent(matches, query);
        queries.map(toMediaQuery).forEach(emitChangeEvent);
    }
    /**
     * Replace current registry with simulated registry...
     * Note: this is required since MediaQueryList::matches is 'readOnly'
     */
    forceRegistryMatches(queries, matches) {
        const registry = new Map();
        queries.forEach(query => {
            registry.set(query, { matches });
        });
        this.matchMedia.registry = registry;
    }
    /**
     * Save current MatchMedia::registry items.
     */
    cacheRegistryMatches() {
        const target = this.originalRegistry;
        target.clear();
        this.matchMedia.registry.forEach((value, key) => {
            target.set(key, value);
        });
        this.hasCachedRegistryMatches = true;
    }
    /**
     * Restore original, 'true' registry
     */
    restoreRegistryMatches() {
        const target = this.matchMedia.registry;
        target.clear();
        this.originalRegistry.forEach((value, key) => {
            target.set(key, value);
        });
        this.originalRegistry.clear();
        this.hasCachedRegistryMatches = false;
    }
    /**
     * Manually emit a MediaChange event via the MatchMedia to MediaMarshaller and MediaObserver
     */
    emitChangeEvent(matches, query) {
        this.matchMedia.source.next(new MediaChange(matches, query));
    }
    get currentActivations() {
        return this.matchMedia.activations;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.0-ea322f4", ngImport: i0, type: MediaTrigger, deps: [{ token: i1.BreakPointRegistry }, { token: i2.MatchMedia }, { token: LAYOUT_CONFIG }, { token: PLATFORM_ID }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.0-ea322f4", ngImport: i0, type: MediaTrigger, providedIn: 'root' }); }
}
export { MediaTrigger };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.0-ea322f4", ngImport: i0, type: MediaTrigger, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.BreakPointRegistry }, { type: i2.MatchMedia }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [LAYOUT_CONFIG]
                }] }, { type: Object, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtdHJpZ2dlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2xpYnMvZmxleC1sYXlvdXQvY29yZS9tZWRpYS10cmlnZ2VyL21lZGlhLXRyaWdnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzlELE9BQU8sRUFBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUU1RCxPQUFPLEVBQUMsU0FBUyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVwQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUc1QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckQsT0FBTyxFQUFDLGFBQWEsRUFBc0IsTUFBTSwwQkFBMEIsQ0FBQzs7OztBQUU1RTs7R0FFRztBQUNILE1BQ2EsWUFBWTtJQUV2QixZQUNjLFdBQStCLEVBQy9CLFVBQXNCLEVBQ0MsWUFBaUMsRUFDbkMsV0FBbUIsRUFDdEIsU0FBYztRQUpoQyxnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7UUFDL0IsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUNDLGlCQUFZLEdBQVosWUFBWSxDQUFxQjtRQUNuQyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtRQUN0QixjQUFTLEdBQVQsU0FBUyxDQUFLO1FBcUt0Qyw2QkFBd0IsR0FBRyxLQUFLLENBQUM7UUFDakMsd0JBQW1CLEdBQWtCLEVBQUUsQ0FBQztRQUN4QyxxQkFBZ0IsR0FBZ0MsSUFBSSxHQUFHLEVBQTBCLENBQUM7SUF0SzFGLENBQUM7SUFFRDs7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QUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztJQUNyQyxDQUFDOzhHQTFLVSxZQUFZLDhFQUtYLGFBQWEsYUFDYixXQUFXLGFBQ1gsUUFBUTtrSEFQVCxZQUFZLGNBREEsTUFBTTs7U0FDbEIsWUFBWTsyRkFBWixZQUFZO2tCQUR4QixVQUFVO21CQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7MEJBTXpCLE1BQU07MkJBQUMsYUFBYTs7MEJBQ3BCLE1BQU07MkJBQUMsV0FBVzs7MEJBQ2xCLE1BQU07MkJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIFBMQVRGT1JNX0lEfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7RE9DVU1FTlQsIGlzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5pbXBvcnQge2Zyb21FdmVudCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7dGFrZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge21lcmdlQWxpYXN9IGZyb20gJy4uL2FkZC1hbGlhcyc7XG5pbXBvcnQge01lZGlhQ2hhbmdlfSBmcm9tICcuLi9tZWRpYS1jaGFuZ2UnO1xuaW1wb3J0IHtNYXRjaE1lZGlhfSBmcm9tICcuLi9tYXRjaC1tZWRpYS9tYXRjaC1tZWRpYSc7XG5pbXBvcnQge0JyZWFrUG9pbnRSZWdpc3RyeSwgT3B0aW9uYWxCcmVha1BvaW50fSBmcm9tICcuLi9icmVha3BvaW50cy9icmVhay1wb2ludC1yZWdpc3RyeSc7XG5pbXBvcnQge3NvcnREZXNjZW5kaW5nUHJpb3JpdHl9IGZyb20gJy4uL3V0aWxzL3NvcnQnO1xuaW1wb3J0IHtMQVlPVVRfQ09ORklHLCBMYXlvdXRDb25maWdPcHRpb25zfSBmcm9tICcuLi90b2tlbnMvbGlicmFyeS1jb25maWcnO1xuXG4vKipcbiAqIENsYXNzXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE1lZGlhVHJpZ2dlciB7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcm90ZWN0ZWQgYnJlYWtwb2ludHM6IEJyZWFrUG9pbnRSZWdpc3RyeSxcbiAgICAgIHByb3RlY3RlZCBtYXRjaE1lZGlhOiBNYXRjaE1lZGlhLFxuICAgICAgQEluamVjdChMQVlPVVRfQ09ORklHKSBwcm90ZWN0ZWQgbGF5b3V0Q29uZmlnOiBMYXlvdXRDb25maWdPcHRpb25zLFxuICAgICAgQEluamVjdChQTEFURk9STV9JRCkgcHJvdGVjdGVkIF9wbGF0Zm9ybUlkOiBPYmplY3QsXG4gICAgICBASW5qZWN0KERPQ1VNRU5UKSBwcm90ZWN0ZWQgX2RvY3VtZW50OiBhbnkpIHtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBhY3RpdmF0ZSByYW5nZSBvZiBicmVha3BvaW50c1xuICAgKiBAcGFyYW0gbGlzdCBhcnJheSBvZiBtZWRpYVF1ZXJ5IG9yIGFsaWFzIHN0cmluZ3NcbiAgICovXG4gIGFjdGl2YXRlKGxpc3Q6IHN0cmluZ1tdKSB7XG4gICAgbGlzdCA9IGxpc3QubWFwKGl0ID0+IGl0LnRyaW0oKSk7IC8vIHRyaW0gcXVlcmllc1xuXG4gICAgdGhpcy5zYXZlQWN0aXZhdGlvbnMoKTtcbiAgICB0aGlzLmRlYWN0aXZhdGVBbGwoKTtcbiAgICB0aGlzLnNldEFjdGl2YXRpb25zKGxpc3QpO1xuXG4gICAgdGhpcy5wcmVwYXJlQXV0b1Jlc3RvcmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0b3JlIG9yaWdpbmFsLCAncmVhbCcgYnJlYWtwb2ludHMgYW5kIGVtaXQgZXZlbnRzXG4gICAqIHRvIHRyaWdnZXIgc3RyZWFtIG5vdGlmaWNhdGlvblxuICAgKi9cbiAgcmVzdG9yZSgpIHtcbiAgICBpZiAodGhpcy5oYXNDYWNoZWRSZWdpc3RyeU1hdGNoZXMpIHtcbiAgICAgIGNvbnN0IGV4dHJhY3RRdWVyeSA9IChjaGFuZ2U6IE1lZGlhQ2hhbmdlKSA9PiBjaGFuZ2UubWVkaWFRdWVyeTtcbiAgICAgIGNvbnN0IGxpc3QgPSB0aGlzLm9yaWdpbmFsQWN0aXZhdGlvbnMubWFwKGV4dHJhY3RRdWVyeSk7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmRlYWN0aXZhdGVBbGwoKTtcbiAgICAgICAgdGhpcy5yZXN0b3JlUmVnaXN0cnlNYXRjaGVzKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZhdGlvbnMobGlzdCk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLm9yaWdpbmFsQWN0aXZhdGlvbnMgPSBbXTtcbiAgICAgICAgaWYgKHRoaXMucmVzaXplU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgdGhpcy5yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAvLyBJbnRlcm5hbCBNZXRob2RzXG4gIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4gIC8qKlxuICAgKiBXaGVuZXZlciB3aW5kb3cgcmVzaXplcywgaW1tZWRpYXRlbHkgYXV0by1yZXN0b3JlIG9yaWdpbmFsXG4gICAqIGFjdGl2YXRpb25zIChpZiB3ZSBhcmUgc2ltdWxhdGluZyBhY3RpdmF0aW9ucylcbiAgICovXG4gIHByaXZhdGUgcHJlcGFyZUF1dG9SZXN0b3JlKCkge1xuICAgIGNvbnN0IGlzQnJvd3NlciA9IGlzUGxhdGZvcm1Ccm93c2VyKHRoaXMuX3BsYXRmb3JtSWQpICYmIHRoaXMuX2RvY3VtZW50O1xuICAgIGNvbnN0IGVuYWJsZUF1dG9SZXN0b3JlID0gaXNCcm93c2VyICYmIHRoaXMubGF5b3V0Q29uZmlnLm1lZGlhVHJpZ2dlckF1dG9SZXN0b3JlO1xuXG4gICAgaWYgKGVuYWJsZUF1dG9SZXN0b3JlKSB7XG4gICAgICBjb25zdCByZXNpemUkID0gZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpLnBpcGUodGFrZSgxKSk7XG4gICAgICB0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbiA9IHJlc2l6ZSQuc3Vic2NyaWJlKHRoaXMucmVzdG9yZS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTm90aWZ5IGFsbCBtYXRjaE1lZGlhIHN1YnNjcmliZXJzIG9mIGRlLWFjdGl2YXRpb25zXG4gICAqXG4gICAqIE5vdGU6IHdlIG11c3QgZm9yY2UgJ21hdGNoZXMnIHVwZGF0ZXMgZm9yXG4gICAqICAgICAgIGZ1dHVyZSBtYXRjaE1lZGlhOjphY3RpdmF0aW9uIGxvb2t1cHNcbiAgICovXG4gIHByaXZhdGUgZGVhY3RpdmF0ZUFsbCgpIHtcbiAgICBjb25zdCBsaXN0ID0gdGhpcy5jdXJyZW50QWN0aXZhdGlvbnM7XG5cbiAgICB0aGlzLmZvcmNlUmVnaXN0cnlNYXRjaGVzKGxpc3QsIGZhbHNlKTtcbiAgICB0aGlzLnNpbXVsYXRlTWVkaWFDaGFuZ2VzKGxpc3QsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWNoZSBjdXJyZW50IGFjdGl2YXRpb25zIGFzIHNvcnRlZCwgcHJpb3JpdGl6ZWQgbGlzdCBvZiBNZWRpYUNoYW5nZXNcbiAgICovXG4gIHByaXZhdGUgc2F2ZUFjdGl2YXRpb25zKCkge1xuICAgIGlmICghdGhpcy5oYXNDYWNoZWRSZWdpc3RyeU1hdGNoZXMpIHtcbiAgICAgIGNvbnN0IHRvTWVkaWFDaGFuZ2UgPSAocXVlcnk6IHN0cmluZykgPT4gbmV3IE1lZGlhQ2hhbmdlKHRydWUsIHF1ZXJ5KTtcbiAgICAgIGNvbnN0IG1lcmdlTVFBbGlhcyA9IChjaGFuZ2U6IE1lZGlhQ2hhbmdlKSA9PiB7XG4gICAgICAgIGNvbnN0IGJwOiBPcHRpb25hbEJyZWFrUG9pbnQgPSB0aGlzLmJyZWFrcG9pbnRzLmZpbmRCeVF1ZXJ5KGNoYW5nZS5tZWRpYVF1ZXJ5KTtcbiAgICAgICAgcmV0dXJuIG1lcmdlQWxpYXMoY2hhbmdlLCBicCk7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLm9yaWdpbmFsQWN0aXZhdGlvbnMgPSB0aGlzLmN1cnJlbnRBY3RpdmF0aW9uc1xuICAgICAgICAgIC5tYXAodG9NZWRpYUNoYW5nZSlcbiAgICAgICAgICAubWFwKG1lcmdlTVFBbGlhcylcbiAgICAgICAgICAuc29ydChzb3J0RGVzY2VuZGluZ1ByaW9yaXR5KTtcblxuICAgICAgdGhpcy5jYWNoZVJlZ2lzdHJ5TWF0Y2hlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZSBzZXQgbWFudWFsIGFjdGl2YXRpb25zIGZvciBzcGVjaWZpZWQgbWVkaWFRdWVyeSBsaXN0XG4gICAqL1xuICBwcml2YXRlIHNldEFjdGl2YXRpb25zKGxpc3Q6IHN0cmluZ1tdKSB7XG4gICAgaWYgKCEhdGhpcy5vcmlnaW5hbFJlZ2lzdHJ5KSB7XG4gICAgICB0aGlzLmZvcmNlUmVnaXN0cnlNYXRjaGVzKGxpc3QsIHRydWUpO1xuICAgIH1cbiAgICB0aGlzLnNpbXVsYXRlTWVkaWFDaGFuZ2VzKGxpc3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvciBzcGVjaWZpZWQgbWVkaWFRdWVyeSBsaXN0IG1hbnVhbGx5IHNpbXVsYXRlIGFjdGl2YXRpb25zIG9yIGRlYWN0aXZhdGlvbnNcbiAgICovXG4gIHByaXZhdGUgc2ltdWxhdGVNZWRpYUNoYW5nZXMocXVlcmllczogc3RyaW5nW10sIG1hdGNoZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgdG9NZWRpYVF1ZXJ5ID0gKHF1ZXJ5OiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IGxvY2F0b3IgPSB0aGlzLmJyZWFrcG9pbnRzO1xuICAgICAgY29uc3QgYnAgPSBsb2NhdG9yLmZpbmRCeUFsaWFzKHF1ZXJ5KSB8fCBsb2NhdG9yLmZpbmRCeVF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIHJldHVybiBicCA/IGJwLm1lZGlhUXVlcnkgOiBxdWVyeTtcbiAgICB9O1xuICAgIGNvbnN0IGVtaXRDaGFuZ2VFdmVudCA9IChxdWVyeTogc3RyaW5nKSA9PiB0aGlzLmVtaXRDaGFuZ2VFdmVudChtYXRjaGVzLCBxdWVyeSk7XG5cbiAgICBxdWVyaWVzLm1hcCh0b01lZGlhUXVlcnkpLmZvckVhY2goZW1pdENoYW5nZUV2ZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGN1cnJlbnQgcmVnaXN0cnkgd2l0aCBzaW11bGF0ZWQgcmVnaXN0cnkuLi5cbiAgICogTm90ZTogdGhpcyBpcyByZXF1aXJlZCBzaW5jZSBNZWRpYVF1ZXJ5TGlzdDo6bWF0Y2hlcyBpcyAncmVhZE9ubHknXG4gICAqL1xuICBwcml2YXRlIGZvcmNlUmVnaXN0cnlNYXRjaGVzKHF1ZXJpZXM6IHN0cmluZ1tdLCBtYXRjaGVzOiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVnaXN0cnkgPSBuZXcgTWFwPHN0cmluZywgTWVkaWFRdWVyeUxpc3Q+KCk7XG4gICAgcXVlcmllcy5mb3JFYWNoKHF1ZXJ5ID0+IHtcbiAgICAgIHJlZ2lzdHJ5LnNldChxdWVyeSwge21hdGNoZXN9IGFzIE1lZGlhUXVlcnlMaXN0KTtcbiAgICB9KTtcblxuICAgIHRoaXMubWF0Y2hNZWRpYS5yZWdpc3RyeSA9IHJlZ2lzdHJ5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNhdmUgY3VycmVudCBNYXRjaE1lZGlhOjpyZWdpc3RyeSBpdGVtcy5cbiAgICovXG4gIHByaXZhdGUgY2FjaGVSZWdpc3RyeU1hdGNoZXMoKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5vcmlnaW5hbFJlZ2lzdHJ5O1xuXG4gICAgdGFyZ2V0LmNsZWFyKCk7XG4gICAgdGhpcy5tYXRjaE1lZGlhLnJlZ2lzdHJ5LmZvckVhY2goKHZhbHVlOiBNZWRpYVF1ZXJ5TGlzdCwga2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIHRhcmdldC5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG4gICAgdGhpcy5oYXNDYWNoZWRSZWdpc3RyeU1hdGNoZXMgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RvcmUgb3JpZ2luYWwsICd0cnVlJyByZWdpc3RyeVxuICAgKi9cbiAgcHJpdmF0ZSByZXN0b3JlUmVnaXN0cnlNYXRjaGVzKCkge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMubWF0Y2hNZWRpYS5yZWdpc3RyeTtcblxuICAgIHRhcmdldC5jbGVhcigpO1xuICAgIHRoaXMub3JpZ2luYWxSZWdpc3RyeS5mb3JFYWNoKCh2YWx1ZTogTWVkaWFRdWVyeUxpc3QsIGtleTogc3RyaW5nKSA9PiB7XG4gICAgICB0YXJnZXQuc2V0KGtleSwgdmFsdWUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vcmlnaW5hbFJlZ2lzdHJ5LmNsZWFyKCk7XG4gICAgdGhpcy5oYXNDYWNoZWRSZWdpc3RyeU1hdGNoZXMgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBlbWl0IGEgTWVkaWFDaGFuZ2UgZXZlbnQgdmlhIHRoZSBNYXRjaE1lZGlhIHRvIE1lZGlhTWFyc2hhbGxlciBhbmQgTWVkaWFPYnNlcnZlclxuICAgKi9cbiAgcHJpdmF0ZSBlbWl0Q2hhbmdlRXZlbnQobWF0Y2hlczogYm9vbGVhbiwgcXVlcnk6IHN0cmluZykge1xuICAgIHRoaXMubWF0Y2hNZWRpYS5zb3VyY2UubmV4dChuZXcgTWVkaWFDaGFuZ2UobWF0Y2hlcywgcXVlcnkpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGN1cnJlbnRBY3RpdmF0aW9ucygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2hNZWRpYS5hY3RpdmF0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgaGFzQ2FjaGVkUmVnaXN0cnlNYXRjaGVzID0gZmFsc2U7XG4gIHByaXZhdGUgb3JpZ2luYWxBY3RpdmF0aW9uczogTWVkaWFDaGFuZ2VbXSA9IFtdO1xuICBwcml2YXRlIG9yaWdpbmFsUmVnaXN0cnk6IE1hcDxzdHJpbmcsIE1lZGlhUXVlcnlMaXN0PiA9IG5ldyBNYXA8c3RyaW5nLCBNZWRpYVF1ZXJ5TGlzdD4oKTtcblxuICBwcml2YXRlIHJlc2l6ZVN1YnNjcmlwdGlvbiE6IFN1YnNjcmlwdGlvbjtcbn1cblxuIl19
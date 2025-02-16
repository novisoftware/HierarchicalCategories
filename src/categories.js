/*
 * Copyright (C) 2025 Novisoftware
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Expand category name to name set.
 * (trace down)
 */
function expandCategories(categories, categoryName) {
    let foundNames = new Set();
    if (categories.filter(obj => obj["name"] === categoryName) === 0) {
        return foundNames;
    }
    foundNames.add(categoryName);

    while (true) {
        let isChanged = false;
        const addNames = new Set();

        categories.forEach(obj => {
            const currentName = obj["name"];
            if ("parents" in obj) {
                const parentNames = obj["parents"];
                parentNames.forEach(parentName => {
                    if (foundNames.has(parentName)) {
                        if (!foundNames.has(currentName)) {
                            isChanged = true;
                            foundNames.add(currentName);
                        }
                    }
                }
                );
            }
            if ("children" in obj) {
                if (foundNames.has(currentName)) {
                    const beforeN = foundNames.size;
                    foundNames = new Set([...foundNames, ...obj["children"]]);
                    const afterN = foundNames.size;
                    if (beforeN != afterN) {
                        isChanged = true;
                    }
                }
            }
        });
        if (! isChanged) {
            break;
        }
    }

    return foundNames;
}

export {expandCategories};
